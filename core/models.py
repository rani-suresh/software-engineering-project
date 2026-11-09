from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [('admin', 'Admin'), ('teacher', 'Teacher'), ('student', 'Student')]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'admin'
        super().save(*args, **kwargs)


class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                limit_choices_to={'role': 'teacher'}, related_name='courses_taught')

    def __str__(self):
        return f'{self.code} - {self.name}'


class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE,
                                limit_choices_to={'role': 'student'}, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')

    class Meta:
        unique_together = ('student', 'course')


class ClassSession(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()
    topic = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ('course', 'date')
        ordering = ['-date']


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [('present', 'Present'), ('absent', 'Absent'), ('late', 'Late')]
    session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)

    class Meta:
        unique_together = ('session', 'student')