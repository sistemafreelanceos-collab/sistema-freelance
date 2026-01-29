export default function SkeletonDashboard() {
    return (
        <div className="max-w-7xl mx-auto pb-20 p-4 sm:p-6 animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
                <div className="space-y-3">
                    <div className="h-8 w-64 bg-gray-800 rounded-lg"></div>
                    <div className="h-4 w-48 bg-gray-800 rounded-lg"></div>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 w-32 bg-gray-800 rounded-lg"></div>
                    ))}
                </div>
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-[#161B22] border border-gray-800 rounded-2xl p-4 space-y-3">
                        <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
                        <div className="h-6 w-24 bg-gray-800 rounded-lg"></div>
                        <div className="h-8 w-32 bg-gray-800 rounded-lg"></div>
                    </div>
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="h-[400px] bg-[#161B22] border border-gray-800 rounded-2xl"></div>
                </div>
                <div className="space-y-4">
                    <div className="h-[400px] bg-[#161B22] border border-gray-800 rounded-2xl"></div>
                </div>
            </div>
        </div>
    );
}
