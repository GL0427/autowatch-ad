package com.autowatch.ad;

import android.content.Context;
import android.content.SharedPreferences;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** SharedPreferences 持久化：首次运行时间、累计成功次数、跨天重置。 */
public class Prefs {

    public static final String PREFS_NAME = "autowatch_ad_prefs";
    public static final String KEY_FIRST_RUN_MS = "firstRunMs";
    public static final String KEY_DAILY_COUNT = "dailyCount";
    public static final String KEY_LAST_RUN_DAY = "lastRunDay";

    private final SharedPreferences prefs;

    public Prefs(Context context) {
        this.prefs = context.getApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public long getFirstRunMs() {
        return prefs.getLong(KEY_FIRST_RUN_MS, 0L);
    }

    /** 仅首次写入；一经写入永不覆盖，保证杀进程/重启后 30 天周期连续。 */
    public void ensureFirstRun() {
        if (!prefs.contains(KEY_FIRST_RUN_MS)) {
            prefs.edit().putLong(KEY_FIRST_RUN_MS, System.currentTimeMillis()).commit();
        }
    }

    public int getCount() {
        return prefs.getInt(KEY_DAILY_COUNT, 0);
    }

    public void incrementCount() {
        resetIfNewDay();
        prefs.edit().putInt(KEY_DAILY_COUNT, getCount() + 1).commit();
    }

    public void resetIfNewDay() {
        String today = today();
        if (!today.equals(prefs.getString(KEY_LAST_RUN_DAY, ""))) {
            prefs.edit()
                    .putString(KEY_LAST_RUN_DAY, today)
                    .putInt(KEY_DAILY_COUNT, 0)
                    .commit();
        }
    }

    private static String today() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }
}
