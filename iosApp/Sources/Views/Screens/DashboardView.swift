import SwiftUI
import HealthKit

struct DashboardView: View {
    let session: SessionSnapshot
    let onSignOut: () -> Void
    @EnvironmentObject private var authViewModel: AuthViewModel
    @State private var isHealthConnected = false
    @State private var todaySteps: Int?
    @State private var weeklySteps: [DaySteps] = []
    @State private var weeklyTotal: Int = 0
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            // Overview Tab
            overviewTab
                .tabItem {
                    Label("Overview", systemImage: "chart.bar.fill")
                }
                .tag(0)
            
            // Challenges Tab
            challengesTab
                .tabItem {
                    Label("Challenges", systemImage: "trophy.fill")
                }
                .tag(1)
            
            // Profile Tab
            profileTab
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(2)
        }
        .task {
            await checkHealthStatus()
        }
        .onReceive(authViewModel.$requiresHealthPermission) { _ in
            Task {
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                await checkHealthStatus()
            }
        }
    }
    
    // MARK: - Overview Tab
    
    private var overviewTab: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome Header
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Welcome back")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Text(session.user.name)
                            .font(.title.bold())
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    
                    // Apple Health Status Card
                    healthStatusCard
                    
                    if isHealthConnected {
                        // Today's Steps
                        todayStepsCard
                        
                        // Weekly Trend
                        weeklyTrendCard
                        
                        // Quick Stats
                        quickStatsCard
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Sign Out", action: onSignOut)
                }
            }
        }
    }
    
    private var healthStatusCard: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: isHealthConnected ? "heart.circle.fill" : "heart.circle")
                    .font(.title)
                    .foregroundColor(isHealthConnected ? .green : .secondary)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Apple Health")
                        .font(.headline)
                    if isHealthConnected {
                        Text("Connected")
                            .font(.subheadline)
                            .foregroundColor(.green)
                    } else {
                        Text("Not Connected")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                if isHealthConnected {
                    Button {
                        Task { await syncSteps() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                            .font(.title3)
                    }
                }
            }
            
            if !isHealthConnected {
                Text("Connect Apple Health to sync your latest steps and compete on the leaderboard.")
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .font(.subheadline)
                
                Button {
                    authViewModel.requiresHealthPermission = true
                } label: {
                    Text("Connect Apple Health")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
        )
        .padding(.horizontal)
    }
    
    private var todayStepsCard: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: "figure.walk")
                    .font(.title2)
                    .foregroundColor(.blue)
                Text("Today's Steps")
                    .font(.headline)
                Spacer()
            }
            
            if let steps = todaySteps {
                VStack(spacing: 8) {
                    Text("\(steps)")
                        .font(.system(size: 56, weight: .bold, design: .rounded))
                        .foregroundColor(.primary)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "target")
                            .font(.caption)
                        Text("Goal: 10,000 steps")
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                    
                    // Progress bar
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.gray.opacity(0.2))
                            
                            RoundedRectangle(cornerRadius: 4)
                                .fill(
                                    LinearGradient(
                                        colors: [.blue, .cyan],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: geometry.size.width * CGFloat(min(Double(steps) / 10000.0, 1.0)))
                        }
                    }
                    .frame(height: 8)
                    .padding(.horizontal)
                    
                    Text("\(Int((Double(steps) / 10000.0) * 100))% of daily goal")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else {
                ProgressView()
                    .padding()
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
        )
        .padding(.horizontal)
    }
    
    private var weeklyTrendCard: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.title2)
                    .foregroundColor(.green)
                Text("This Week")
                    .font(.headline)
                Spacer()
                Text("\(weeklyTotal) steps")
                    .font(.subheadline.bold())
                    .foregroundColor(.secondary)
            }
            
            if !weeklySteps.isEmpty {
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(weeklySteps) { dayStep in
                        VStack(spacing: 4) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(dayStep.isToday ? Color.blue : Color.blue.opacity(0.6))
                                .frame(width: 32, height: max(CGFloat(dayStep.steps) / 150.0, 10))
                            
                            Text(dayStep.dayLabel)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 100)
            } else {
                ProgressView()
                    .padding()
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
        )
        .padding(.horizontal)
    }
    
    private var quickStatsCard: some View {
        VStack(spacing: 12) {
            Text("Quick Stats")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack(spacing: 12) {
                statBox(
                    icon: "flame.fill",
                    value: weeklyTotal > 0 ? "\(weeklyTotal / 7)" : "-",
                    label: "Daily Avg",
                    color: .orange
                )
                
                statBox(
                    icon: "calendar",
                    value: "\(weeklySteps.filter { $0.steps > 0 }.count)/7",
                    label: "Active Days",
                    color: .purple
                )
                
                statBox(
                    icon: "trophy.fill",
                    value: "0",
                    label: "Challenges",
                    color: .yellow
                )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
        )
        .padding(.horizontal)
    }
    
    private func statBox(icon: String, value: String, label: String, color: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text(value)
                .font(.title3.bold())
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.tertiarySystemBackground))
        )
    }
    
    // MARK: - Challenges Tab
    
    private var challengesTab: some View {
        NavigationView {
            VStack {
                Image(systemName: "trophy")
                    .font(.system(size: 60))
                    .foregroundColor(.secondary)
                Text("No Active Challenges")
                    .font(.title3.bold())
                    .padding(.top)
                Text("Join or create a challenge to compete with friends!")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            .navigationTitle("Challenges")
        }
    }
    
    // MARK: - Profile Tab
    
    private var profileTab: some View {
        NavigationView {
            List {
                Section {
                    HStack(spacing: 16) {
                        if let imageURL = session.user.image {
                            AsyncImage(url: imageURL) { image in
                                image
                                    .resizable()
                                    .scaledToFill()
                            } placeholder: {
                                Circle()
                                    .fill(Color.gray.opacity(0.3))
                            }
                            .frame(width: 60, height: 60)
                            .clipShape(Circle())
                        } else {
                            Circle()
                                .fill(Color.blue.opacity(0.2))
                                .frame(width: 60, height: 60)
                                .overlay(
                                    Text(String(session.user.name.prefix(1)))
                                        .font(.title.bold())
                                        .foregroundColor(.blue)
                                )
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(session.user.name)
                                .font(.headline)
                            if let email = session.user.email {
                                Text(email)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                Section("Settings") {
                    NavigationLink {
                        Text("Notifications")
                    } label: {
                        Label("Notifications", systemImage: "bell")
                    }
                    
                    NavigationLink {
                        Text("Privacy")
                    } label: {
                        Label("Privacy", systemImage: "lock")
                    }
                }
                
                Section {
                    Button(role: .destructive, action: onSignOut) {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
    
    // MARK: - Data Fetching
    
    private func checkHealthStatus() async {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            await MainActor.run {
                isHealthConnected = false
            }
            return
        }
        
        let healthStore = HKHealthStore()
        
        do {
            try await healthStore.requestAuthorization(toShare: [], read: [stepType])
            
            // Fetch steps to verify access
            let steps = await fetchTodaySteps()
            let weekly = await fetchWeeklySteps()
            
            await MainActor.run {
                if steps != nil {
                    todaySteps = steps
                    weeklySteps = weekly.steps
                    weeklyTotal = weekly.total
                    isHealthConnected = true
                } else {
                    isHealthConnected = false
                }
            }
        } catch {
            print("Health authorization failed: \(error)")
            await MainActor.run {
                isHealthConnected = false
            }
        }
    }
    
    private func fetchTodaySteps() async -> Int? {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return nil }
        
        let now = Date()
        let startOfDay = Calendar.current.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        
        let healthStore = HKHealthStore()
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, result, error in
                if let error = error {
                    print("Error fetching today's steps: \(error)")
                    continuation.resume(returning: nil)
                    return
                }
                
                if let sum = result?.sumQuantity() {
                    let steps = Int(sum.doubleValue(for: HKUnit.count()))
                    continuation.resume(returning: steps)
                } else {
                    continuation.resume(returning: 0)
                }
            }
            healthStore.execute(query)
        }
    }
    
    private func fetchWeeklySteps() async -> (steps: [DaySteps], total: Int) {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            return ([], 0)
        }
        
        let calendar = Calendar.current
        let now = Date()
        let startOfWeek = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: now))!
        
        let healthStore = HKHealthStore()
        let predicate = HKQuery.predicateForSamples(withStart: startOfWeek, end: now, options: .strictStartDate)
        
        var interval = DateComponents()
        interval.day = 1
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsCollectionQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum,
                anchorDate: startOfWeek,
                intervalComponents: interval
            )
            
            query.initialResultsHandler = { _, results, error in
                if let error = error {
                    print("Error fetching weekly steps: \(error)")
                    continuation.resume(returning: ([], 0))
                    return
                }
                
                guard let results = results else {
                    continuation.resume(returning: ([], 0))
                    return
                }
                
                var daySteps: [DaySteps] = []
                var total = 0
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "EEE"
                
                results.enumerateStatistics(from: startOfWeek, to: now) { statistics, _ in
                    let steps = Int(statistics.sumQuantity()?.doubleValue(for: .count()) ?? 0)
                    let dayLabel = dateFormatter.string(from: statistics.startDate)
                    let isToday = calendar.isDateInToday(statistics.startDate)
                    
                    daySteps.append(DaySteps(
                        date: statistics.startDate,
                        steps: steps,
                        dayLabel: dayLabel,
                        isToday: isToday
                    ))
                    total += steps
                }
                
                continuation.resume(returning: (daySteps, total))
            }
            
            healthStore.execute(query)
        }
    }
    
    private func syncSteps() async {
        do {
            try await authViewModel.healthManager.syncLatestSteps(session: session)
            
            let steps = await fetchTodaySteps()
            let weekly = await fetchWeeklySteps()
            
            await MainActor.run {
                if let steps = steps {
                    todaySteps = steps
                }
                weeklySteps = weekly.steps
                weeklyTotal = weekly.total
            }
        } catch {
            print("Failed to sync steps:", error)
        }
    }
}

// MARK: - Supporting Types

struct DaySteps: Identifiable {
    let id = UUID()
    let date: Date
    let steps: Int
    let dayLabel: String
    let isToday: Bool
}
