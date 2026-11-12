import hashlib
import json
import math
import os
import urllib.error
import urllib.request

from django.core.cache import cache

from .models import AttendanceRecord

ATTENDED = ['present', 'late']


def student_stats(student, course):
    records = list(
        AttendanceRecord.objects.filter(student=student, session__course=course)
        .select_related('session').order_by('session__date')
    )
    total = len(records)
    if total == 0:
        return None

    attended = sum(1 for r in records if r.status in ATTENDED)
    overall = attended / total * 100

    recent = records[-5:]
    recent_rate = sum(1 for r in recent if r.status in ATTENDED) / len(recent) * 100

    streak = 0
    for r in reversed(records):
        if r.status == 'absent':
            streak += 1
        else:
            break

    # Score 0-100: low overall rate, a worsening trend and consecutive absences all add risk
    score = 0.0
    if overall < 75:
        score += 75 - overall
    if recent_rate < overall:
        score += (overall - recent_rate) * 0.5
    score += streak * 8
    score = max(0, min(100, score))

    level = 'high' if score >= 40 else 'medium' if score >= 20 else 'low'

    # Projection: percentage after 10 more classes at the recent rate
    projected = (attended + recent_rate / 100 * 10) / (total + 10) * 100

    return {
        'student_id': student.id,
        'name': student.get_full_name() or student.username,
        'total_sessions': total,
        'overall': round(overall, 1),
        'recent_rate': round(recent_rate, 1),
        'absence_streak': streak,
        'risk_score': round(score, 1),
        'risk_level': level,
        'projected_percentage': round(projected, 1),
    }


def course_risk_rows(course):
    rows = []
    for e in course.enrollments.select_related('student'):
        stats = student_stats(e.student, course)
        if stats:
            rows.append(stats)
    rows.sort(key=lambda r: r['risk_score'], reverse=True)
    return rows



def student_insights(student):
    out = []
    for e in student.enrollments.select_related('course'):
        records = AttendanceRecord.objects.filter(student=student, session__course=e.course)
        total = records.count()
        if total == 0:
            continue
        attended = records.filter(status__in=ATTENDED).count()
        pct = attended / total * 100

        needed = max(0, 3 * total - 4 * attended)       # classes in a row to get back to 75%
        can_miss = max(0, (4 * attended) // 3 - total)  # classes that can still be missed

        if pct < 75:
            level = 'bad' if pct < 60 else 'mid'
            tip = (f'You are at {pct:.0f}%. Attend your next {needed} '
                   f'class{"es" if needed != 1 else ""} in a row to get back to 75%.')
        elif can_miss == 0:
            level = 'mid'
            tip = f'You are at {pct:.0f}%, right on the limit. Missing the next class would drop you below 75%.'
        else:
            level = 'good'
            tip = (f'You are at {pct:.0f}%. You can miss up to {can_miss} more '
                   f'class{"es" if can_miss != 1 else ""} and stay above 75%.')

        out.append({
            'course_id': e.course_id,
            'course': e.course.name,
            'percentage': round(pct, 1),
            'level': level,
            'classes_needed': needed,
            'can_miss': can_miss,
            'tip': tip,
        })
    return out


# ---------------------------------------------------------------
# 3. AI summary (Gemini free tier, template fallback)
# ---------------------------------------------------------------
def _call_gemini(prompt):
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        raise RuntimeError('No GEMINI_API_KEY set')
    model = os.environ.get('GEMINI_MODEL', 'gemini-flash-latest')
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
    body = json.dumps({'contents': [{'parts': [{'text': prompt}]}]}).encode('utf-8')
    req = urllib.request.Request(
        url, data=body,
        headers={'Content-Type': 'application/json', 'x-goog-api-key': key},
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return data['candidates'][0]['content']['parts'][0]['text'].strip()


def _template_summary(course_name, rows):
    high = [r for r in rows if r['risk_level'] == 'high']
    medium = [r for r in rows if r['risk_level'] == 'medium']
    if not rows:
        return f'{course_name}: no attendance has been recorded yet.'
    avg = sum(r['overall'] for r in rows) / len(rows)
    names = ', '.join(r['name'] for r in high[:5]) or 'none'
    return (
        f'{course_name}: {len(rows)} students tracked with an average attendance of {avg:.0f}%. '
        f'{len(high)} student(s) are at high risk ({names}) and {len(medium)} at medium risk. '
        f'Contact students with long absence streaks first.'
    )


def generate_summary(course_name, rows):
    """Returns (text, source, note). source is 'ai' or 'template'."""
    if not rows:
        return _template_summary(course_name, rows), 'template', None

    lines = '\n'.join(
        f"- {r['name']}: {r['overall']}% overall, {r['recent_rate']}% in the last 5 classes, "
        f"{r['absence_streak']} absences in a row, risk {r['risk_level']}"
        for r in rows
    )
    prompt = (
        f"You are an assistant inside a university attendance system. Write a short summary "
        f"(maximum 120 words, plain language, no markdown) for the teacher of the course "
        f"'{course_name}'. Say how healthy overall attendance is, which students need attention "
        f"first and why, and give one practical suggestion. Attendance below 75% is a problem.\n\n"
        f"Data:\n{lines}"
    )

    cache_key = 'ai-summary-' + hashlib.md5(prompt.encode()).hexdigest()
    cached = cache.get(cache_key)
    if cached:
        return cached, 'ai', None

    try:
        text = _call_gemini(prompt)
        cache.set(cache_key, text, 60 * 60)
        return text, 'ai', None
    except urllib.error.HTTPError as e:
        note = 'The free AI limit was reached, so an automatic summary is shown.' if e.code == 429 \
            else f'AI service error ({e.code}), so an automatic summary is shown.'
    except RuntimeError:
        note = 'No AI key is configured, so an automatic summary is shown.'
    except Exception:
        note = 'The AI service could not be reached, so an automatic summary is shown.'

    return _template_summary(course_name, rows), 'template', note