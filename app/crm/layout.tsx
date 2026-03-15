/**
 * Layout component for CRM routes that renders its children.
 *
 * @param children - React nodes to be rendered inside the CRM layout
 * @returns The provided `children` wrapped in a React fragment
 */
export default function CrmLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
