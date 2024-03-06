import * as si from 'systeminformation';
import * as k8s from '@kubernetes/client-node';
import * as express from 'express';
import * as cors from 'cors';
import mqtt from 'mqtt';

async function getSysInfo() {
  try {
    // CPU usage
    const cpuLoad = await si.currentLoad();
    // Memory usage
    const memUsage = await si.mem();
    const usedMemoryPercentage = (memUsage.active / memUsage.total) * 100;
    // Disk usage
    const diskUsage = await si.fsSize();
    // CPU temperature
    const cpuTemp = await si.cpuTemperature();
    return {
      cpuLoad: cpuLoad.currentLoad.toFixed(2),
      memoryUsage: usedMemoryPercentage.toFixed(2),
      diskUsage: diskUsage[0].use.toFixed(2),
      cpuTemperature: cpuTemp.main
    }

  } catch (error) {
    console.error(`Error getting system info: ${error}`);
    return null;
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
    return totalPods;
  } catch (error) {
    console.error(`Error getting k8s info: ${error}`);
    return null;
  }
}


const app = express()
app.use(cors())
app.use(express.json())
app.get('/', async (req: any, res: any) => {
  const pods = await getK8sInfo();
  if (!pods) {
    res.status(500).json({
      message: 'Error getting pods'
    })
  }
  const sysInfo = await getSysInfo();
  if (!sysInfo) {
    res.status(500).json({
      message: 'Error getting system info'
    })
  }
  res.status(200).json({
    message: 'Success',
    totalPods: pods,
    ...sysInfo
  })
})

app.listen(3001, () => {
  console.log(`monitor app listening on port 3001`)
})
//send  system info every 10s via mqtt


const protocol = 'mqtt'
const host = '192.168.90.45'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `${protocol}://${host}:${port}`

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'admin',
  password: 'luuduchuy2001',
  reconnectPeriod: 1000,
})

const topic = '/system-info'
client.on('connect', () => {
  setInterval(async () => {
    const sysInfo = await getSysInfo();
    const message = JSON.stringify(sysInfo);
    client.publish(topic, message, {qos: 0, retain: false}, (error) => {
      if (error) {
        console.error(error)
      } else {
        console.log('Published message successfully')
      }
    })
  }, 2_000)
})