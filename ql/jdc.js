// frida -U -F -l Frida_JD_COOKIE.js
// 或者使用jshook注入

const BASE_URL = "http://192.168.6.11:5700"  //青龙地址 结尾不含/
// 青龙面板 - 系统设置 - 应用设置 中生成
const CLIENT_ID = "67xoRd_UKSuB"
const CLIENT_SECRET = "W-BT5kU-0S6K3BrRMO6vy9xr"


const toast = (text) => {
  Java.scheduleOnMainThread(function () {
    var toast = Java.use("android.widget.Toast");
    toast.makeText(Java.use("android.app.ActivityThread").currentApplication().getApplicationContext(), Java.use("java.lang.String").$new(text), 1).show();
  });
}


const updateWSCK = (value) => {
  try {
    const OkHttpClient = Java.use("okhttp3.OkHttpClient").$new()
    const RequestBuilder = Java.use("okhttp3.Request$Builder")
    const RequestBody = Java.use("okhttp3.RequestBody");
    const MediaType = Java.use("okhttp3.MediaType");

    const loginResp = OkHttpClient.newCall(
      RequestBuilder.$new().url(`${BASE_URL}/open/auth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`).build()
    ).execute().body().string();
    const token = JSON.parse(loginResp).data.token

    const envsResp = OkHttpClient.newCall(
      RequestBuilder.$new().url(`${BASE_URL}/open/envs`).addHeader("Authorization", `Bearer ${token}`).build()
    ).execute().body().string();

    const cookie = JSON.parse(envsResp).data?.find(env => env.name === "JD_COOKIE")

    const updateEnvsResp = OkHttpClient.newCall(
      RequestBuilder.$new().url(`${BASE_URL}/open/envs`)
        .method("PUT", RequestBody.create(MediaType.parse("application/json"), JSON.stringify({
          "value": value,
          "name": cookie.name,
          "id": cookie.id
        })))
        .addHeader("Authorization", `Bearer ${token}`).build()
    ).execute().body().string();

    const enableEnvsResp = OkHttpClient.newCall(
      RequestBuilder.$new().url(`${BASE_URL}/open/envs/enable`)
        .method("PUT", RequestBody.create(MediaType.parse("application/json"), JSON.stringify([cookie.id])))
        .addHeader("Authorization", `Bearer ${token}`).build()
    ).execute().body().string();
    
    
    
    return JSON.parse(updateEnvsResp).code === 200 && JSON.parse(enableEnvsResp).code === 200
  } catch (error) {
    return false
  }
}

const hookJava = () => Java.perform(function () {
  const cm = Java.use("com.tencent.smtt.sdk.CookieManager")
  const cookie = cm.getInstance().getCookie("https://m.jd.com")
  if (cookie.includes("pt_key") && cookie.includes("pt_pin")) {
    if (updateWSCK(cookie)) {
      toast("JD_COOKIE更新成功")
    } else {
      toast("JD_COOKIE更新失败")
    }
  }
});


setTimeout(hookJava, 3000)
