import * as si from 'systeminformation';
import * as k8s from '@kubernetes/client-node';

async function getSysInfo() {
  try {
    // CPU usage
    const cpuLoad = await si.currentLoad();
    console.log(`CPU Usage: ${cpuLoad.currentLoad.toFixed(2)}%`);

    // Memory usage
    const memUsage = await si.mem();
    const usedMemoryPercentage = (memUsage.active / memUsage.total) * 100;
    console.log(`Memory Usage: ${usedMemoryPercentage.toFixed(2)}%`);

    // Disk usage
    const diskUsage = await si.fsSize();
    console.log(`Disk (${diskUsage[0].fs}): ${diskUsage[0].use.toFixed(2)}% used`);

    // CPU temperature
    const cpuTemp = await si.cpuTemperature();
    console.log(`CPU Temperature: ${cpuTemp.main}°C`);

  } catch (error) {
    console.error(`Error getting system info: ${error}`);
  }
}

const getK8sInfo = async () => {
  try {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    //get all namespaces
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api); //k8s.CoreV1Api
    const namespaces = await k8sApi.listNamespace();
    const listNamespaces = namespaces.body.items.map(ns => ns.metadata?.name);
    let totalPods = 0;
    const systemNs = [
      'kube-system',
      'kube-public',
      'kube-node-lease',
      'default',
      'ingress',
      'container-registry',
    ]
    for (const ns of listNamespaces) {
      if (systemNs.includes(ns)) {
        continue;
      }
      const pods = await k8sApi.listNamespacedPod(ns);
      totalPods += pods.body.items.length;
    }
    console.log("Total pods: ", totalPods);
  } catch (error) {
    console.error(`Error getting k8s info: ${error}`);
  }
}

const main = async () => {
  await getSysInfo();
  await getK8sInfo();
}

// setInterval(main, 3000);
main().then();