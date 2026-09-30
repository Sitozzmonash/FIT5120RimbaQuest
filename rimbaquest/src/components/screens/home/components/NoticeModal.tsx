import React from "react";
import { useUserStore } from "../../../../store/useUserStore";
import { WoodModal } from "../../../common/game/WoodModal";

export function NoticeModal() {
  const notice = useUserStore((state) => state.notice);
  const title = useUserStore((state) => state.noticeTitle);
  const positive = useUserStore((state) => state.noticePositive);
  const close = () => useUserStore.getState().setNotice(null);

  return (
    <WoodModal
      visible={Boolean(notice)}
      onRequestClose={close}
      icon={positive ? "check" : "alert"}
      positive={positive}
      stars={false}
      title={title ?? "Heads up!"}
      message={notice ?? ""}
      actionLabel="OK"
      onAction={close}
    />
  );
}
