import { Image, StyleSheet, Platform, PermissionsAndroid, Pressable, Text, View, Button, Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { BleManager } from 'react-native-ble-plx';
import { useEffect, useState } from 'react';

import { useNavigation, NavigationProp } from '@react-navigation/native';

// Define the type for your navigation routes
type RootStackParamList = {
  Home: undefined;
  details: { device: { id: string; name: string } };
};



import { ScanMode } from 'react-native-ble-plx';
import { FlatList } from 'react-native-gesture-handler';

export const ble_mgr = new BleManager();

const ble_devices: Array<any> = [];


export var signal_log: number[] = [85]; //battery level graph data
export var ble_lastUpdateTime: number = 0;




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






const BATTERY_SERVICE_UUID = '180F';
const BATTERY_LEVEL_CHAR_UUID = '2A19';

export async function subscribeBatteryLevel(device: any, onUpdate: any) {
  await device.discoverAllServicesAndCharacteristics();
  return device.monitorCharacteristicForService(
    BATTERY_SERVICE_UUID,
    BATTERY_LEVEL_CHAR_UUID,
    (error: any, char: any) => {
      if (error) {
        console.log('subscribeBatteryLevel(): Notification error:', error);
        Alert.alert('Notification Error', error.message);
        return;
      }
      if (char?.value) {
        const raw = atob(char.value);
        const level = raw.charCodeAt(0);
        onUpdate(level);
      }
    }
  );
}


function notify_batt_level(value: any) {
  console.log("Battery Level: ", value);
  // You can add additional logic here, such as updating the UI or storing the value

  ble_lastUpdateTime = Date.now();

  signal_log.push(value);

  if (signal_log.length > 30) {
    signal_log.shift(); // Remove the oldest item to maintain the limit
  }


}






export var glob_device: any = null;
export var glob_notif_subscription: any;


async function sub_batt_level(connectedDevice: any) {
  glob_notif_subscription = await subscribeBatteryLevel(connectedDevice, notify_batt_level);
}


function btDeviceSelected(device: any): void {

  console.log(`Selected device: ${device.name} (${device.id})`);
  // You can add additional logic here, such as connecting to the device
  ble_mgr.connectToDevice(device.id)
    .then((connectedDevice) => {
      console.log(`Connected to device: ${connectedDevice.name} (${connectedDevice.id})`);
      // Perform further actions with the connected device if needed

      glob_device = connectedDevice;
      sub_batt_level(connectedDevice);

      connectedDevice.discoverAllServicesAndCharacteristics()
        .then((deviceWithServices) => {
          console.log(`Discovered services and characteristics for device: ${deviceWithServices.name} (${deviceWithServices.id})`);
          // You can now interact with the device's services and characteristics


          deviceWithServices.services().then((services) => {
            services.forEach((service) => {
              service.characteristics().then((characteristics) => {
                characteristics.forEach((characteristic) => {
                  console.log(`Characteristic: ${characteristic.uuid}`);
                });
              }).catch((error) => {
                console.error(`Failed to get characteristics for service: ${service.uuid}`, error);
              });
            });
          }).catch((error) => {
            console.error(`Failed to get services for device: ${deviceWithServices.name} (${deviceWithServices.id})`, error);
          });


        })
        .catch((error) => {
          console.error(`Failed to discover services and characteristics for device: ${connectedDevice.name} (${connectedDevice.id})`, error);
        });

    })
    .catch((error) => {
      console.error(`Failed to connect to device: ${device.name} (${device.id})`, error);
    });
}





const SelectableDevice = ({
  device,
  onSelect,
}: {
  device: { id: string; name: string, rssi: number };
  onSelect: (device: { id: string; name: string }) => void;
}) => {
  const [pressed, setPressed] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <Pressable
    // onPress={() => {
    //   onSelect(device);
    //   navigation.navigate('details', { device })
    // }}
    //onPressIn={() => setPressed(true)}
    //onPressOut={() => setPressed(false)}
    >

      <View>
        <Button
          title={`${device.name} ${device.id}  ${device.rssi}`}
          onPress={() => {
            onSelect(device);
            navigation.navigate('details', { device })
          }}
          color={Platform.OS === 'ios' ? '#007AFF' : '#2196F3'}
        />
      </View>

    </Pressable>
  );
};




export default function HomeScreen() {

  // Inside the HomeScreen component
  const [ble_devices, setDevices] = useState<Array<any>>([]);

  const [ble_scanning, setBleScanning] = useState(false);


  const [ble_refreshing, setBleRefreshing] = useState(false);

  const refreshBLEList = async () => {		
    setBleRefreshing(true);
    setTimeout(() => {
			//setData((prev) => [...prev, prev.length + 1]);
			setBleRefreshing(false);
		}, 1000);
  }



  useEffect(() => {

    const startBleScan = async () => {
      const hasPermissions = await checkBlePermissions();
      if (hasPermissions) {
        console.log('BLE permissions are granted. Starting device scan...');

        ble_mgr.startDeviceScan(null, { scanMode: ScanMode.LowLatency }, (error, device) => {
          if (error) {
            // console.error('Device scan error:', error);
            Alert.alert('Device Scan Error', error.message);
            setBleScanning(false);
            return;
          }

          if (device) {
            setBleScanning(true);
            // console.log(device);
            // Avoid duplicates by checking if the device is already in the array
            setDevices((prevDevices) => {
              const exists = prevDevices.some((d) => d.id === device.id);
              if (!exists) {
                // console.log("New device found:", device.id, device.rssi, device.name);

                if( device.name == null ){
                  // console.log("Device has no name, skipping: ", device.id, device.rssi);
                  return [...prevDevices];
                }

                // Add the new device to the list
                return [...prevDevices, device];

              }
              
              //console.log("Device already exists in the list:", device.id, device.rssi);
              // Optionally, you can update the RSSI value if needed
              const updatedDevices = prevDevices.map((d) => {
                if (d.id === device.id) {

                  //console.log( "update: ", device.id, d.rssi, device.rssi);
                  return { ...d, rssi: device.rssi };
                }
                return d;
              });


              return updatedDevices;
              //return prevDevices;
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
    <ThemedView style={styles.container}>
		<SafeAreaView style={{ flex: 1, 
		padding: 10, 
		//backgroundColor: 'rgba(250,100,250,0.0)' 
		}} edges={['top', 'bottom']}>
		

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Battery Monitor</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedText type="subtitle">Select Device</ThemedText>

      <ThemedText>{ble_scanning ? 'Scanning...' : 'Not Scanning'}</ThemedText>

      <View style={{ paddingBottom: 10, flex:1, backgroundColor: 'rgba(202, 130, 130, 0)' }}>
        <FlatList
							onRefresh={refreshBLEList}
							refreshing={ble_refreshing}
							data={ble_devices}
							// keyExtractor={(item, index) => item.key}
							renderItem={({ item }) => (
                <View>
                {/* <ThemedText>{item.name} {item.id}</ThemedText> */}
                <SelectableDevice key={item.id} device={item} onSelect={btDeviceSelected} />
                <Text></Text>
                </View>
							)}
						/>

        </View>
        

    </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  container: {
		flex: 1,
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


