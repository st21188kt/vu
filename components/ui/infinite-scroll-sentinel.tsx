"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollSentinelProps {
    onInteract: () => void;
    hasMore: boolean;
    isLoading: boolean;
    rootMargin?: string;
}

export function InfiniteScrollSentinel({ 
    onInteract, 
    hasMore, 
    isLoading, 
    rootMargin = "100px" 
}: InfiniteScrollSentinelProps) {
    const observerTarget = useRef<HTMLDivElement>(null);
    const onInteractRef = useRef(onInteract);

    // Update the ref ensuring the latest callback is used without breaking the observer effect
    useEffect(() => {
        onInteractRef.current = onInteract;
    }, [onInteract]);

    useEffect(() => {
        const element = observerTarget.current;
        if (!element || !hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onInteractRef.current();
                }
            },
            { rootMargin }
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [hasMore, isLoading, rootMargin]);

    if (!hasMore) return null;

    return (
        <div ref={observerTarget} className="flex justify-center py-4 w-full">
            {isLoading && (
                <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            )}
            {/* Invisible sentinel */}
            {!isLoading && <div className="h-4 w-full" />}
        </div>
    );
}
