package com.autowatch.ad;

/** 唯一可微调常量中心：实机适配时只改本文件。 */
public class Config {

    private Config() {
    }

    // 目标包名（qishui_android/__init__.py:36 已核实）
    public static final String TARGET_PACKAGE = "com.luna.music";
    public static final long THIRTY_DAYS_MS = 30L * 24 * 60 * 60 * 1000;

    // 关键词数组
    public static final String[] ENTRY_KEYWORDS = {"立即解锁", "立即领取", "立即领取时长", "免", "免广告", "免广告看视频"};
    public static final String[] CLAIM_SUCCESS_KEYWORDS = {"领取成功"};
    public static final String[] CLAIM_REWARD_KEYWORDS = {"领取奖励", "立即领取", "确认领取"};
    public static final String[] CONTINUE_WATCH_KEYWORDS = {"继续观看"};
    public static final String[] CLOSE_KEYWORDS = {"关闭", "×", "✕", "✖"};
    public static final String[] RENEW_DIALOG_KEYWORDS = {"元开通", "取消", "以后再说"};
    public static final String[] COUNTDOWN_KEYWORDS = {"秒后可领奖励", "秒后领取", "秒后关闭", "秒后获得"};

    // 超时常量（毫秒 / 轮数）
    public static final long AD_WAIT_MS = 30000;
    public static final long ENTRY_WAIT_MS = 60000;
    public static final long CLAIM1_WAIT_MS = 20000;
    public static final long CLAIM2_WAIT_MS = 15000;
    public static final long POLL_INTERVAL_MS = 800;
    public static final long MAX_IDLE_ROUNDS = 10;
}
