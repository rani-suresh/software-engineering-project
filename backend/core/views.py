from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .models import User, Course, Enrollment, ClassSession, AttendanceRecord
from .permissions import IsAdminRole, IsTeacherOrAdmin, AdminWriteOrReadOnly
from .serializers import (UserSerializer, CourseSerializer,
                          EnrollmentSerializer, SessionSerializer)

ATTENDED = ['present', 'late']   # late counts as attended


class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'id': user.id,
            'username': user.username,
            'name': user.get_full_name() or user.username,
            'role': user.role,
        })


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = User.objects.all().order_by('id')
        role = self.request.query_params.get('role')
        return qs.filter(role=role) if role else qs


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [AdminWriteOrReadOnly]


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = Enrollment.objects.select_related('student', 'course')
        course = self.request.query_params.get('course')
        return qs.filter(course_id=course) if course else qs


class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsTeacherOrAdmin]

    def get_queryset(self):
        qs = ClassSession.objects.all()
        user = self.request.user
        if user.role == 'teacher':
            qs = qs.filter(course__teacher=user)
        course = self.request.query_params.get('course')
        return qs.filter(course_id=course) if course else qs

    @action(detail=True, methods=['get', 'post'])
    def mark(self, request, pk=None):
        session = self.get_object()

        if request.method == 'GET':
            existing = {r.student_id: r.status for r in session.records.all()}
            roster = [{
                'student': e.student_id,
                'name': e.student.get_full_name() or e.student.username,
                'status': existing.get(e.student_id),
            } for e in session.course.enrollments.select_related('student')]
            return Response(roster)

        valid = {'present', 'absent', 'late'}
        enrolled = set(session.course.enrollments.values_list('student_id', flat=True))
        saved = 0
        for item in request.data.get('records', []):
            if item.get('student') in enrolled and item.get('status') in valid:
                AttendanceRecord.objects.update_or_create(
                    session=session, student_id=item['student'],
                    defaults={'status': item['status']})
                saved += 1
        return Response({'saved': saved})


@api_view(['GET'])
def my_attendance(request):
    user = request.user
    result = []
    for e in user.enrollments.select_related('course'):
        records = AttendanceRecord.objects.filter(student=user, session__course=e.course)
        total = records.count()
        attended = records.filter(status__in=ATTENDED).count()
        result.append({
            'course_id': e.course_id,
            'course': e.course.name,
            'total_sessions': total,
            'attended': attended,
            'absent': records.filter(status='absent').count(),
            'percentage': round(attended / total * 100, 1) if total else None,
        })
    return Response(result)


@api_view(['GET'])
@permission_classes([IsTeacherOrAdmin])
def course_report(request, course_id):
    course = get_object_or_404(Course, pk=course_id)
    if request.user.role == 'teacher' and course.teacher_id != request.user.id:
        return Response({'detail': 'Not your course.'}, status=403)

    rows = []
    for e in course.enrollments.select_related('student'):
        recs = AttendanceRecord.objects.filter(student=e.student, session__course=course)
        total = recs.count()
        attended = recs.filter(status__in=ATTENDED).count()
        rows.append({
            'student_id': e.student_id,
            'name': e.student.get_full_name() or e.student.username,
            'total_sessions': total,
            'attended': attended,
            'percentage': round(attended / total * 100, 1) if total else None,
        })
    return Response({'course': course.name, 'students': rows})