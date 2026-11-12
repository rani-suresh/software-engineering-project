from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')
router.register('courses', views.CourseViewSet, basename='course')
router.register('enrollments', views.EnrollmentViewSet, basename='enrollment')
router.register('sessions', views.SessionViewSet, basename='session')

urlpatterns = [
    path('auth/login/', views.LoginView.as_view()),
    path('my-attendance/', views.my_attendance),
    path('reports/course/<int:course_id>/', views.course_report),
    path('ai/at-risk/<int:course_id>/', views.at_risk),
    path('ai/summary/<int:course_id>/', views.ai_summary),
    path('ai/my-insights/', views.my_insights),
    path('', include(router.urls)),
]