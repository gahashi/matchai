export const INBOX_CHANGED_EVENT =
    "brava-pass:inbox-changed";

export type InboxChangedDetail = {
    itemId?: number;
    action?:
        | "read"
        | "unread"
        | "archive"
        | "refresh";
};

export function dispatchInboxChanged(
    detail: InboxChangedDetail = {}
) {
    if (typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<InboxChangedDetail>(
            INBOX_CHANGED_EVENT,
            {
                detail,
            }
        )
    );
}