import json
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from .forms import SignUpForm, LoginForm, NoteForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from .models import Enrollment, Course, Video, Note

# ... the rest of your view functions

def home(request):
    return render(request, 'core/home.html')

def signup_view(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dashboard')
    else:
        form = SignUpForm()
    return render(request, 'core/signup.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('dashboard')
    else:
        form = LoginForm()
    return render(request, 'core/login.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('home')

@login_required
def dashboard_view(request):
    enrolled_courses = Enrollment.objects.filter(user=request.user).select_related('course')
    context = {
        'enrolled_courses': [enrollment.course for enrollment in enrolled_courses]
    }
    return render(request, 'core/dashboard.html', context)

@login_required
def courses_list_view(request):
    enrolled_course_ids = Enrollment.objects.filter(user=request.user).values_list('course__id', flat=True)
    all_courses = Course.objects.all()
    context = {
        'all_courses': all_courses,
        'enrolled_course_ids': set(enrolled_course_ids),
    }
    return render(request, 'core/courses_list.html', context)

@login_required
@require_POST
def enroll_view(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    Enrollment.objects.get_or_create(user=request.user, course=course)
    return redirect('dashboard')

@login_required
def video_player_view(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    
    is_enrolled = Enrollment.objects.filter(user=request.user, course=course).exists()
    if not is_enrolled:
        return redirect('dashboard')

    all_videos = course.videos.all().order_by('id')
    
    video_id_from_url = request.GET.get('vid')
    if video_id_from_url:
        current_video = get_object_or_404(Video, video_id=video_id_from_url, course=course)
    else:
        current_video = all_videos.first()

    if request.method == 'POST':
        form = NoteForm(request.POST)
        if form.is_valid():
            note = form.save(commit=False)
            note.user = request.user
            note.video = current_video
            note.save()
            return redirect(request.path_info + f'?vid={current_video.video_id}')
    else:
        form = NoteForm()

    notes = Note.objects.filter(user=request.user, video=current_video)

    context = {
        'course': course,
        'all_videos': all_videos,
        'current_video': current_video,
        'notes': notes,
        'form': form,
    }
    return render(request, 'core/video_player.html', context)


