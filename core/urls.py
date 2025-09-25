# core/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('courses/', views.courses_list_view, name='courses_list'),
    path('enroll/<int:course_id>/', views.enroll_view, name='enroll'),
    path('course/<int:course_id>/', views.video_player_view, name='video_player'),

]