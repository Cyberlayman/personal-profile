/** 
根据 Wi-Fi 或数据网络，将特定策略组（reject除外）切换成 direct 
自行修改 Dlist/Dpolicy/Cpolicy

[task_local]
event-network https://github.com/Cyberlayman/personal-profile/raw/main/quantumultX/script/network-switch.js, tag = Direct 策略切换, img-url = https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Universal/SSID.png
//$notify("当前网络",$environment.ssid? $environment.ssid : String($environment.cellular.carrierName))
// The $prefs is for persistent store: $prefs.valueForKey(key), $prefs.setValueForKey(value, key), $prefs.removeValueForKey(key), $prefs.removeAllValues().

**/


console.log(JSON.stringify($environment))
var cname = $environment.ssid? $environment.ssid : "蜂窝数据"
//String($environment.cellular.carrierName)
var icon= $environment.ssid?  "🛜": "📶"

// 直连名单，Wi-Fi SSID 或 cellular.carrierName 移动运营商名
let Dlist = ["Openwrt_5G", "Openwrt_2.4G"]
// 直连 ssid 下需要切换 direct 的 策略组，请自行设定（仅限 static 类型，且需其子策略组内已包含 direct）
let dt = "direct"
let Dpolicy = {"节点选择": dt, "Telegram": "节点选择", "OpenAI":dt, "Copilot":dt}
// 其它非直连 ssid 下默认的策略组，需自行设定
let Cpolicy = {"节点选择": "自动选择", "Telegram": "香港", "OpenAI":"日本", "Copilot":"美国"}

// 需要重置时设置为1，并手动执行一次
let Preset = 0

var date = new Date(); // 创建一个Date对象
var year = date.getFullYear(); // 获取年份
var month = date.getMonth() + 1; // 获取月份（注意：月份从0开始，需要加1）
var day = date.getDate(); // 获取日期
var hours = date.getHours(); // 获取小时
var minutes = date.getMinutes(); // 获取分钟
var seconds = date.getSeconds(); // 获取秒钟

// 格式化日期字符串，例如：2023-02-22 14:34:16
var formattedDate = year + '-' + addZero(month) + '-' + addZero(day) + ' ' + addZero(hours) + ':' + addZero(minutes) + ':' + addZero(seconds);

// 补零函数，用于将单个数字补零，例如：将2转换为02
function addZero(num) {
  if (num < 10) {
    return '0' + num;
  } else {
    return num;
  }
}

// get policy state
const message_Get = {
    action: "get_policy_state"
};

//pssid=""
let pname= $prefs.valueForKey("pssid") || "NULL-SSID"
pname = Preset==1? "RESET-SSID":pname
// read ssids 持久化
if (pname=="NULL-SSID") {
    console.log("\n初次使用记录")
    $prefs.setValueForKey(cname, "pssid")
} else if(pname == "RESET-SSID") {
    console.log("\n重置网络记录")
    $prefs.setValueForKey(cname, "pssid")
} else {
    //console.log("上次记录ssid: ➟ " + $prefs.valueForKey("pssid"))
    $prefs.setValueForKey(cname, "pssid") //更新 ssid
}

function Display(JsonList) {
    let rt = JSON.stringify(JsonList).replace(/{|}|"/g,"").replace(/:/g," ➟ ").replace(/,/g,"\n")
    return rt
}

console.log("--------------------------------\n\n🚦 已设定在以下 ⟱ 网络中切换成直连  \n"+Dlist.join(" ⇔ ")+"\n--------------------------------\n")
console.log("🤖 时间："+formattedDate+"\n👥 本次网络变化： "+pname+ " ➟ "+cname+"\n--------------------------------\n")

const message_Set = {
    action: "set_policy_state",
    content: Dpolicy
};

// restore 策略组设置
const message_Set1 = {
    action: "set_policy_state",
    content: Cpolicy
};

if(Dlist.indexOf(cname)!=-1 && Dlist.indexOf(pname)==-1) { //需要切换成 direct的场景
$configuration.sendMessage(message_Get).then(resolve => {
    if (resolve.error) {
        console.log(resolve.error);
    }
    if (resolve.ret) {
        let output=JSON.stringify(resolve.ret);
        //$notify("🎉 当前网络在直连名单中",cname, output)
    }
    $configuration.sendMessage(message_Set).then(resolve => {
            if (resolve.error) {
            console.log(resolve.error);
            }
            if (resolve.ret) {
                let output=JSON.stringify(resolve.ret);
                console.log("\n\n🎉 以下策略组已切换到直连\n\n"+Display(Dpolicy))
                $notify(icon+" 当前网络 [ "+ pname+" ➟ "+cname +" ]", "☑️ 以下策略组已切换到直连", Display(Dpolicy))
            }
            $done();
        }
    ) 
}, reject => {
    // Normally will never happen.
    $done();
});
} else if(Dlist.indexOf(cname)== -1 && Dlist.indexOf(pname)!=-1){ // 需要切换成 默认的场景
$configuration.sendMessage(message_Set1).then(resolve => {
    if (resolve.error) {
        console.log(resolve.error);
    }
    if (resolve.ret) {
        let output=JSON.stringify(resolve.ret);
        console.log("\n\n🔙 已切换回默认策略\n\n"+Display(Cpolicy))
        $notify(icon+" 当前网络 [ " +pname+" ➟ "+ cname+" ]", "🔙 已切换回默认策略",Display(Cpolicy))
    }
    $done();
}, reject => {
    // Normally will never happen.
    $done();
});
} else if(Dlist.indexOf(cname)!= -1 && Dlist.indexOf(pname)!=-1) {
    console.log("🎉 无需进行切换，保持直连\n" + "\n🎯 两者均在直连列表中")
    console.log("🔘 当前策略：\n"+Display(Dpolicy))
    $done()
} else if(Dlist.indexOf(cname)== -1 && Dlist.indexOf(pname)==-1) {
    console.log("⚠️ 无需进行切换，保持默认策略\n" + "\n⚠️ 两者均不在直连列表中\n")
    console.log("🔘 当前策略：\n"+Display(Cpolicy))
    $done()
}
