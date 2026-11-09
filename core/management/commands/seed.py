import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from core.models import User, Course, Enrollment, ClassSession, AttendanceRecord


class Command(BaseCommand):
    help = 'Seed demo data'

    def handle(self, *args, **options):
        if User.objects.filter(username='teacher1').exists():
            self.stdout.write('Already seeded.')
            return

        teachers = [User.objects.create_user(f'teacher{i}', password='teacher123',
                    first_name=f'Teacher{i}', last_name='Demo', role='teacher') for i in (1, 2)]
        students = [User.objects.create_user(f'student{i}', password='student123',
                    first_name=f'Student{i}', last_name='Demo', role='student') for i in range(1, 21)]

        courses = [
            Course.objects.create(code='CS101', name='Programming Fundamentals', teacher=teachers[0]),
            Course.objects.create(code='CS201', name='Data Structures', teacher=teachers[0]),
            Course.objects.create(code='CS301', name='Databases', teacher=teachers[1]),
        ]

        # each student has a different "attendance habit" so the AI part has variety
        rate = {s.id: random.choice([0.95, 0.85, 0.7, 0.55]) for s in students}

        for course in courses:
            enrolled = random.sample(students, 15)
            for s in enrolled:
                Enrollment.objects.create(student=s, course=course)
            for d in range(0, 30, 2):
                session = ClassSession.objects.create(
                    course=course, date=date.today() - timedelta(days=d), topic=f'Lecture {d // 2 + 1}')
                records = []
                for s in enrolled:
                    if random.random() < rate[s.id]:
                        status = 'late' if random.random() < 0.1 else 'present'
                    else:
                        status = 'absent'
                    records.append(AttendanceRecord(session=session, student=s, status=status))
                AttendanceRecord.objects.bulk_create(records)

        self.stdout.write(self.style.SUCCESS('Seeded demo data.'))