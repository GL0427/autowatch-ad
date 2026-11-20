package com.autowatch.ad;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

/** 启动引导页：检查无障碍权限、显示剩余天数、拉起目标 App 一次。 */
public class MainActivity extends Activity {

    private static final String ACCESSIBILITY_SERVICE_CLASS = "com.autowatch.ad.AdWatchService";
    private static final long ONE_DAY_MS = Config.THIRTY_DAYS_MS / 30L;

    private Prefs prefs;
    private TextView statusText;
    private TextView remainingDaysText;
    private boolean targetLaunched;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = new Prefs(this);
        prefs.ensureFirstRun();

        statusText = findViewById(R.id.tvStatus);
        remainingDaysText = findViewById(R.id.tvRemainingDays);
        Button openAccessibilityButton = findViewById(R.id.btnOpenAccessibility);
        Button startButton = findViewById(R.id.btnStart);

        refreshAccessibilityStatus();
        remainingDaysText.setText("剩余天数：" + remainingDays() + " 天");

        openAccessibilityButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                openAccessibilitySettings();
            }
        });

        startButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                launchTargetAppOnce();
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshAccessibilityStatus();
    }

    /** 读 Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES 判断本服务是否开启。 */
    private boolean isAccessibilityServiceEnabled() {
        String enabled = Settings.Secure.getString(getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (TextUtils.isEmpty(enabled)) {
            return false;
        }
        String flattened = getPackageName() + "/" + ACCESSIBILITY_SERVICE_CLASS;
        for (String item : enabled.split(":")) {
            String service = item.trim();
            if (service.equals(flattened) || service.equals(ACCESSIBILITY_SERVICE_CLASS)) {
                return true;
            }
        }
        return false;
    }

    private void refreshAccessibilityStatus() {
        if (statusText == null) {
            return;
        }
        statusText.setText(isAccessibilityServiceEnabled()
                ? "无障碍服务已开启"
                : "无障碍服务未开启，请先开启");
    }

    /** 未开启时跳系统无障碍设置页。 */
    private void openAccessibilitySettings() {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
    }

    /** 读 Prefs.firstRunMs 与 Config.THIRTY_DAYS_MS 计算剩余天数，向上取整。 */
    private long remainingDays() {
        long firstRunMs = prefs.getFirstRunMs();
        if (firstRunMs <= 0L) {
            prefs.ensureFirstRun();
            firstRunMs = prefs.getFirstRunMs();
        }
        long remainMs = firstRunMs + Config.THIRTY_DAYS_MS - System.currentTimeMillis();
        if (remainMs <= 0L) {
            return 0L;
        }
        return (remainMs + ONE_DAY_MS - 1L) / ONE_DAY_MS;
    }

    /** 无障碍服务无法自行启动 App；这里只用 PackageManager 拉起目标包一次。 */
    private void launchTargetAppOnce() {
        if (targetLaunched) {
            return;
        }
        PackageManager pm = getPackageManager();
        Intent launchIntent = pm.getLaunchIntentForPackage(Config.TARGET_PACKAGE);
        if (launchIntent == null) {
            Toast.makeText(this, "未找到汽水音乐", Toast.LENGTH_SHORT).show();
            return;
        }
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(launchIntent);
        targetLaunched = true;
    }
}
