import { Image, StyleSheet, Platform, PermissionsAndroid } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { BleManager } from 'react-native-ble-plx';
import { useEffect, useState } from 'react';





const ble_mgr = new BleManager();

const ble_devices: Array<any> = [];





async function requestBlePermissions() {
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    if (
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log('BLE permissions granted');
    } else {
      console.log('BLE permissions denied');
    }
  } catch (err) {
    console.error('Failed to request BLE permissions:', err);
  }
}





async function checkBlePermissions() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN) &&
                    await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) &&
                    await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    return granted;
  }
  return true; // Assume permissions are granted on non-Android platforms
}



export default function HomeScreen() {

// Inside the HomeScreen component
const [ble_devices, setDevices] = useState<Array<any>>([]);

useEffect(() => {
  const startBleScan = async () => {
    const hasPermissions = await checkBlePermissions();
    if (hasPermissions) {
      console.log('BLE permissions are granted. Starting device scan...');

      ble_mgr.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Device scan error:', error);
          return;
        }

        if (device) {
          // Avoid duplicates by checking if the device is already in the array
          setDevices((prevDevices) => {
            const exists = prevDevices.some((d) => d.id === device.id);
            if (!exists) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });
    } else {
      console.log('BLE permissions are not granted. Requesting permissions...');
      await requestBlePermissions();
      // Retry scanning after requesting permissions
      startBleScan();
    }
  };

  startBleScan();

  // Cleanup function to stop scanning when the component unmounts
  return () => {
    ble_mgr.stopDeviceScan();
    console.log('Stopped BLE device scan.');
  };
}, []);



  

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">ble?</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12'
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Device List</ThemedText>
          
          {ble_devices.length > 0 ? (
            ble_devices.map((device) => (
              <ThemedText key={device.id}>
                {device.name || 'Unnamed Device'} ({device.id}) 
                {device.localName || '??'}
              </ThemedText>
            ))
          ) : (
            <ThemedText>No devices found</ThemedText>
          )}
        
      </ThemedView>


      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{' '}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});


