/**
 * Main Application Orchestrator
 * AI-Driven Intelligent Exam System
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import { AuthService } from './services/authService';
import { supabase } from './services/supabaseClient';

// Common Components
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { AuthView } from './components/auth/AuthView';
import { MisconceptionTaxonomyView } from './components/common/MisconceptionTaxonomyView';

// Student Components
import { StudentDashboard } from './components/student/StudentDashboard';
import { MyExamsView } from './components/student/MyExamsView';
import { ActiveExamTaker } from './components/student/ActiveExamTaker';
import { ExamResultView } from './components/student/ExamResultView';
import { PracticeHub } from './components/student/PracticeHub';
import { AIPersonalizedTestLauncher } from './components/student/AIPersonalizedTestLauncher';
import { MasteryTrackerView } from './components/student/MasteryTrackerView';
import { WeakTopicsRemediation } from './components/student/WeakTopicsRemediation';
import { VideoRecommendationsView } from './components/student/VideoRecommendationsView';
import { RewardsStoreView } from './components/student/RewardsStoreView';
import { StudentProfileView } from './components/student/StudentProfileView';

// Teacher Components
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ClassAnalyticsView } from './components/teacher/ClassAnalyticsView';
import { StudentRiskView } from './components/teacher/StudentRiskView';
import { QuestionBankManager } from './components/teacher/QuestionBankManager';
import { CreateExamView } from './components/teacher/CreateExamView';
import { AIExamGeneratorView } from './components/teacher/AIExamGeneratorView';
import { GradingPatternInsightsView } from './components/teacher/GradingPatternInsightsView';
import { TeacherGradingAssistantView } from './components/teacher/TeacherGradingAssistantView';
import { ReportsExportView } from './components/teacher/ReportsExportView';
import { DatasetManagementView } from './components/teacher/DatasetManagementView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'
      || new URLSearchParams(window.location.search).get('type') === 'recovery',
  );
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeResultAttemptId, setActiveResultAttemptId] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    }) ?? { data: { subscription: null } };

    AuthService.getCurrentUser()
      .then(setCurrentUser)
      .catch((error) => console.error('[Auth] Could not restore session:', error))
      .finally(() => setAuthReady(true));

    return () => subscription?.unsubscribe();
  }, []);

  // Sync initial view when user changes or from URL search parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');

      if (viewParam) {
        setActiveView(viewParam);
        return;
      }
    } catch (e) {
      // Fallback
    }

    if (currentUser) {
      if (currentUser.role === 'teacher') {
        setActiveView('teacher_dashboard');
      } else {
        setActiveView('student_dashboard');
      }
    }
  }, [currentUser?.id, currentUser?.role]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'teacher') {
      setActiveView('teacher_dashboard');
    } else {
      setActiveView('student_dashboard');
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
    setActiveExamId(null);
    setActiveResultAttemptId(null);
  };

  const handlePasswordResetComplete = async () => {
    await AuthService.logout();
    setCurrentUser(null);
    setPasswordRecovery(false);
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  };

  const handleNavigate = (view: string) => {
    // Normalize aliases
    let target = view;
    if (view === 'ai_test') target = 'ai_adaptive_test';
    else if (view === 'rewards') target = 'rewards_store';
    else if (view === 'concept_mastery') target = 'mastery_tracker';
    else if (view === 'recommendations') target = 'video_recommendations';
    else if (view === 'practice') target = 'practice_hub';
    else if (view === 'teacher_grading') target = 'teacher_grading_assistant';
    else if (view === 'reports') target = 'reports_export';
    else if (view === 'dashboard') {
      target = currentUser?.role === 'teacher' ? 'teacher_dashboard' : 'student_dashboard';
    }
    setActiveView(target);
  };

  const handleStartExam = (examId: string) => {
    setActiveExamId(examId);
    setActiveView('active_exam');
  };

  const handleExamComplete = (attemptId: string) => {
    setActiveResultAttemptId(attemptId);
    setActiveView('exam_result');
  };

  const handleViewResult = (attemptId: string) => {
    setActiveResultAttemptId(attemptId);
    setActiveView('exam_result');
  };

  if (!authReady) {
    return <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">Checking your session…</div>;
  }

  if (passwordRecovery) {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
        isPasswordRecovery
        onPasswordResetComplete={handlePasswordResetComplete}
      />
    );
  }

  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // Active fullscreen exam view (without distracting navigation chrome)
  if (activeView === 'active_exam' && activeExamId) {
    return (
      <ActiveExamTaker
        examId={activeExamId}
        user={currentUser}
        onComplete={handleExamComplete}
        onCancel={() => setActiveView(currentUser.role === 'teacher' ? 'teacher_dashboard' : 'student_dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Bar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={handleNavigate}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          userRole={currentUser.role}
          activeView={activeView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/90">
          {/* STUDENT VIEWS */}
          {currentUser.role === 'student' && (
            <>
              {activeView === 'student_dashboard' && (
                <StudentDashboard
                  user={currentUser}
                  onNavigate={handleNavigate}
                  onStartExam={handleStartExam}
                  onViewResult={handleViewResult}
                />
              )}

              {activeView === 'my_exams' && (
                <MyExamsView
                  user={currentUser}
                  onStartExam={handleStartExam}
                  onViewResult={handleViewResult}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'practice_hub' && (
                <PracticeHub
                  user={currentUser}
                  onStartExam={handleStartExam}
                />
              )}

              {activeView === 'ai_adaptive_test' && (
                <AIPersonalizedTestLauncher
                  user={currentUser}
                  onStartExam={handleStartExam}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'mastery_tracker' && (
                <MasteryTrackerView
                  user={currentUser}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'weak_topics' && (
                <WeakTopicsRemediation
                  user={currentUser}
                  onNavigate={handleNavigate}
                  onStartExam={handleStartExam}
                />
              )}

              {activeView === 'misconception_taxonomy' && (
                <MisconceptionTaxonomyView
                  user={currentUser}
                  onNavigate={handleNavigate}
                  onStartExam={handleStartExam}
                />
              )}

              {activeView === 'video_recommendations' && (
                <VideoRecommendationsView
                  user={currentUser}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'rewards_store' && (
                <RewardsStoreView user={currentUser} />
              )}

              {activeView === 'student_profile' && (
                <StudentProfileView
                  user={currentUser}
                  onViewResult={handleViewResult}
                />
              )}

              {activeView === 'exam_result' && activeResultAttemptId && (
                <ExamResultView
                  attemptId={activeResultAttemptId}
                  user={currentUser}
                  onNavigate={handleNavigate}
                  onTakePractice={() => handleNavigate('practice_hub')}
                />
              )}
            </>
          )}

          {/* TEACHER VIEWS */}
          {currentUser.role === 'teacher' && (
            <>
              {activeView === 'teacher_dashboard' && (
                <TeacherDashboard
                  user={currentUser}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'class_analytics' && (
                <ClassAnalyticsView
                  user={currentUser}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'student_risk' && (
                <StudentRiskView
                  user={currentUser}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'question_bank' && (
                <QuestionBankManager
                  user={currentUser}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'create_exam' && (
                <CreateExamView
                  user={currentUser}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'ai_exam_generator' && (
                <AIExamGeneratorView
                  user={currentUser}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'grading_patterns' && (
                <GradingPatternInsightsView user={currentUser} />
              )}

              {activeView === 'misconception_taxonomy' && (
                <MisconceptionTaxonomyView
                  user={currentUser}
                  onNavigate={handleNavigate}
                  onStartExam={handleStartExam}
                />
              )}

              {activeView === 'teacher_grading_assistant' && (
                <TeacherGradingAssistantView user={currentUser} />
              )}

              {activeView === 'reports_export' && (
                <ReportsExportView user={currentUser} />
              )}

              {activeView === 'dataset_management' && (
                <DatasetManagementView user={currentUser} />
              )}

              {activeView === 'exam_result' && activeResultAttemptId && (
                <ExamResultView
                  attemptId={activeResultAttemptId}
                  user={currentUser}
                  onNavigate={handleNavigate}
                  onTakePractice={() => handleNavigate('ai_exam_generator')}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
