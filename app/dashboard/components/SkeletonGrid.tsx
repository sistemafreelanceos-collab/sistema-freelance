export default function SkeletonGrid() {
    return (
        <div className="max-w-7xl mx-auto pb-20 p-4 sm:p-6 animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-3">
                    <div className="h-8 w-64 bg-gray-800 rounded-lg"></div>
                    <div className="h-4 w-48 bg-gray-800 rounded-lg"></div>
                </div>
                <div className="h-12 w-40 bg-gray-800 rounded-xl"></div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-48 bg-[#161B22] border border-gray-800 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="h-12 w-12 bg-gray-800 rounded-full"></div>
                            <div className="h-6 w-16 bg-gray-800 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-6 w-3/4 bg-gray-800 rounded-lg"></div>
                            <div className="h-4 w-1/2 bg-gray-800 rounded-lg"></div>
                        </div>
                        <div className="pt-4 border-t border-gray-800">
                            <div className="h-4 w-full bg-gray-800 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
