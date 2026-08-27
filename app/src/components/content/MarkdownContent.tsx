"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type MarkdownContentProps = {
    children: string | null | undefined;
    className?: string;
};

export function MarkdownContent({
                                    children,
                                    className = "",
                                }: MarkdownContentProps) {
    if (!children?.trim()) {
        return null;
    }

    return (
        <div
            className={`bp-markdown ${className}`.trim()}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                    a: ({
                            children: linkChildren,
                            ...props
                        }) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            {linkChildren}
                        </a>
                    ),
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}
