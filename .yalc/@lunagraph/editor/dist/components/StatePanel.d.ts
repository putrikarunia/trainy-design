interface StatePanelProps {
    variables: string[];
    mockValues: Record<string, any>;
    initialValues: Record<string, any>;
    props: string[];
    onUpdateMockValue: (name: string, value: any) => void;
    readOnly?: boolean;
}
export declare function StatePanel({ variables, mockValues, initialValues, props, onUpdateMockValue, readOnly, }: StatePanelProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=StatePanel.d.ts.map