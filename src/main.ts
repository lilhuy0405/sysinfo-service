import * as   si from 'systeminformation';

async function main() {
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
    diskUsage.forEach(disk => {
      console.log(`Disk (${disk.fs}): ${disk.use.toFixed(2)}% used`);
    });

    // CPU temperature
    const cpuTemp = await si.cpuTemperature();
    console.log(`CPU Temperature: ${cpuTemp.main}°C`);
  } catch (error) {
    console.error(`Error getting system info: ${error}`);
  }
}

setInterval(main, 3000);
// main().then();