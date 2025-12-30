import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { getAuthOptions } from '@/auth.config';
import { getServerSession } from 'next-auth/next';

// GET: Generate insights for the authenticated user
export async function GET(req: Request) {
  try {
    const options = await getAuthOptions();
    const session: any = await getServerSession(options as any);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { adminDb } = await getAdmin();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Admin Firestore not initialized' }, { status: 500 });
    }

    // Find user by email
    let userId = (session.user as any)?.id;
    if (!userId) {
      const usersQ = adminDb.collection('users').where('email', '==', session.user.email).limit(1);
      const snaps = await usersQ.get();
      if (snaps.empty) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      userId = snaps.docs[0].id;
    }

    // Get last 30 days of step data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const stepsRef = adminDb.collection('users').doc(userId).collection('steps');
    const stepsQuery = stepsRef.where('date', '>=', thirtyDaysAgoStr).where('date', '<=', todayStr).orderBy('date', 'asc');
    const stepsSnapshot = await stepsQuery.get();

    const stepData: Array<{ date: string; steps: number }> = [];
    stepsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      stepData.push({ date: data.date, steps: data.steps || 0 });
    });

    // Calculate insights
    const totalSteps = stepData.reduce((sum, d) => sum + d.steps, 0);
    const avgStepsPerDay = stepData.length > 0 ? Math.round(totalSteps / stepData.length) : 0;
    const maxSteps = stepData.length > 0 ? Math.max(...stepData.map(d => d.steps)) : 0;
    const minSteps = stepData.length > 0 ? Math.min(...stepData.map(d => d.steps)) : 0;

    // Calculate streak (consecutive days with > 0 steps)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const sortedData = [...stepData].sort((a, b) => b.date.localeCompare(a.date));
    for (let i = 0; i < sortedData.length; i++) {
      if (sortedData[i].steps > 0) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 0;
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    // Get user's active challenges
    const challengesQuery = adminDb.collection('challenges').where('participants', 'array-contains', userId).where('isActive', '==', true);
    const challengesSnapshot = await challengesQuery.get();
    const activeChallenges = challengesSnapshot.size;

    // Calculate weekly comparison (this week vs last week)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - dayOfWeek);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    const thisWeekSteps = stepData.filter(d => new Date(d.date) >= thisWeekStart).reduce((sum, d) => sum + d.steps, 0);
    const lastWeekSteps = stepData.filter(d => {
      const date = new Date(d.date);
      return date >= lastWeekStart && date < thisWeekStart;
    }).reduce((sum, d) => sum + d.steps, 0);

    const weeklyChange = lastWeekSteps > 0 ? Math.round(((thisWeekSteps - lastWeekSteps) / lastWeekSteps) * 100) : 0;

    // Generate personalized insights
    const insights: string[] = [];

    if (avgStepsPerDay >= 10000) {
      insights.push("🎉 Amazing! You're consistently hitting 10,000+ steps per day!");
    } else if (avgStepsPerDay >= 7000) {
      insights.push("👏 Great job! You're averaging over 7,000 steps daily. Keep it up!");
    } else if (avgStepsPerDay >= 5000) {
      insights.push("💪 Good progress! Try to gradually increase to 10,000 steps for optimal health.");
    } else {
      insights.push("📈 Let's boost those numbers! Aim for at least 5,000 steps daily to start.");
    }

    if (currentStreak >= 7) {
      insights.push(`🔥 You're on fire! ${currentStreak}-day streak going strong!`);
    } else if (currentStreak >= 3) {
      insights.push(`⭐ Nice ${currentStreak}-day streak! Keep the momentum going!`);
    }

    if (weeklyChange > 20) {
      insights.push(`📊 Impressive ${weeklyChange}% increase from last week!`);
    } else if (weeklyChange < -20) {
      insights.push(`⚠️ Steps decreased ${Math.abs(weeklyChange)}% this week. Let's bounce back!`);
    }

    if (activeChallenges > 0) {
      insights.push(`🏆 You're participating in ${activeChallenges} active ${activeChallenges === 1 ? 'challenge' : 'challenges'}!`);
    } else {
      insights.push("💡 Join a challenge to stay motivated and compete with friends!");
    }

    // Best day insight
    if (stepData.length > 0) {
      const bestDay = stepData.reduce((max, d) => d.steps > max.steps ? d : max);
      const date = new Date(bestDay.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      insights.push(`🌟 Your best day: ${bestDay.steps.toLocaleString()} steps on ${dayName}!`);
    }

    return NextResponse.json({
      success: true,
      insights: {
        period: '30 days',
        totalSteps,
        avgStepsPerDay,
        maxSteps,
        minSteps,
        currentStreak,
        longestStreak,
        activeChallenges,
        thisWeekSteps,
        lastWeekSteps,
        weeklyChange,
        messages: insights,
        stepData: stepData.slice(-14) // Last 14 days for chart
      }
    });
  } catch (error: any) {
    console.error('Error in /api/insights:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
