import { useCallback, useMemo, useRef } from "react";
import { useMutation } from "convex/react";
import {
    FunctionReference,
    FunctionArgs,
    FunctionReturnType,
} from "convex/server";
import { OptimisticLocalStore } from "convex/browser";

/**
 * A wrapper around useMutation that enforces a "single request in flight" policy.
 * If a mutation is already running, subsequent calls will return the existing promise
 * without triggering the mutation (or its optimistic update) again.
 */
export function useSafeMutation<
    Name extends FunctionReference<"mutation">,
>(mutationReference: Name) {
    const mutate = useMutation(mutationReference);
    const promiseRef = useRef<Promise<FunctionReturnType<Name>> | null>(null);

    const createWrapper = useCallback(
        (baseMutate: typeof mutate) => {
            const wrapper = (args: FunctionArgs<Name>): Promise<FunctionReturnType<Name>> => {
                // If there is already a promise in flight, return it.
                // This skip prevents both the actual mutation and the optimistic update
                // from being triggered again for the same logic.
                if (promiseRef.current !== null) {
                    return promiseRef.current;
                }

                // Call the underlying mutation (which triggers optimistic updates if configured)
                promiseRef.current = baseMutate(args)
                    .finally(() => {
                        // Clear the lock when the mutation finishes (success or failure)
                        promiseRef.current = null;
                    }) as Promise<FunctionReturnType<Name>>;

                return promiseRef.current;
            };

            /**
             * Proxies the .withOptimisticUpdate method from the underlying Convex mutation.
             * This allows chaining while maintaining the "single request in flight" lock.
             */
            wrapper.withOptimisticUpdate = (
                optimisticUpdate: (localQueryStore: OptimisticLocalStore, args: FunctionArgs<Name>) => void,
            ) => {
                const mutatedWithOptimistic = baseMutate.withOptimisticUpdate(optimisticUpdate);
                return createWrapper(mutatedWithOptimistic);
            };

            return wrapper;
        },
        [], // baseMutate is passed as an argument, so no dependencies needed
    );

    return useMemo(() => createWrapper(mutate), [createWrapper, mutate]);
}
