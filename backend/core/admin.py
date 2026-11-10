from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Course, Enrollment, ClassSession, AttendanceRecord

admin.site.register(User, UserAdmin)
admin.site.register([Course, Enrollment, ClassSession, AttendanceRecord])