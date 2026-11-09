from rest_framework import serializers
from .models import User, Course, Enrollment, ClassSession


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        user.set_password(password or 'changeme123')
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'code', 'name', 'teacher', 'teacher_name']

    def get_teacher_name(self, obj):
        if not obj.teacher:
            return None
        return obj.teacher.get_full_name() or obj.teacher.username


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'course', 'course_name']


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSession
        fields = ['id', 'course', 'date', 'topic']