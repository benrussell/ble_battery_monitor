
import { StyleSheet, Image, Platform } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

import {ble_mgr} from './index';
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';


import React from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle, Rect } from 'react-native-svg';


import { signal_log, ble_lastUpdateTime } from './index';
import { Button } from 'react-native';


// const data = [40, 50, 80, 120, 240, 480, 140, 110];
const data = signal_log;


const screenWidth = Dimensions.get('window').width;



function LastUpdateLabel() {
	const [lastUpdate, setLastUpdate] = useState(ble_lastUpdateTime);

	useEffect(() => {
		const interval = setInterval(() => {
			setLastUpdate(ble_lastUpdateTime); // Update with the latest value
		}, 1000); // Adjust the interval as needed

		return () => clearInterval(interval); // Cleanup on unmount
	}, []);

	return (
		<ThemedText style={{ marginVertical: 8 }}>
			Last Update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A'}
			{' '}
			(Delta Time: {lastUpdate ? `${Math.floor((Date.now() - lastUpdate) / 1000)}s` : 'N/A'})
		</ThemedText>
	);
}


import { glob_device, glob_notif_subscription } from './index';
import { useRouter } from 'expo-router';




function queryBLEProperty() {
	console.log('reading battery leevel: ', glob_device);
	readBatteryLevel( glob_device );	
}


// Assuming you have a connected device object `device`
const BATTERY_SERVICE_UUID = '180F';
const BATTERY_LEVEL_CHAR_UUID = '2A19';

async function readBatteryLevel(device: any) {
	const services = await device.discoverAllServicesAndCharacteristics();
	const characteristic = await device.readCharacteristicForService(
		BATTERY_SERVICE_UUID,
		BATTERY_LEVEL_CHAR_UUID
	);
	const batteryLevel = characteristic.value;
	console.log('Battery Level:', batteryLevel);
}



export default function TabTwoScreen() {

	const [dynamicData, setDynamicData] = useState(signal_log);

	const [batteryLevel, setBatteryLevel] = useState<number>(0);

	const router = useRouter();


	async function disconnectBLE() {
		console.log("disconnecting from device: ", glob_device);

		signal_log.length = 0;
		signal_log.push(85); // Reset signal_log to an empty state


		await ble_mgr.cancelDeviceConnection(glob_device.id);
	
		if( glob_notif_subscription ){
			await glob_notif_subscription.remove();
		
		}

	
		console.log("switching tab to /");
		router.push({
			pathname: '/(tabs)',
			params: {},
		}); // Navigate to the main tab screen after disconnecting
	
	
	}
	


	useEffect(() => {
			const interval = setInterval(() => {
				setDynamicData([...signal_log]); // Update state with the latest signal_log
				setBatteryLevel(signal_log[signal_log.length - 1]); // Update battery level from signal_log
			}, 1000); // Adjust the interval as needed

			return () => clearInterval(interval); // Cleanup on unmount
		}, [signal_log, batteryLevel]);


  return (
	<ParallaxScrollView
		  headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
		  headerImage={
			<IconSymbol
			  size={310}
			  color="#808080"
			  name="chevron.left.forwardslash.chevron.right"
			  style={styles.headerImage}
			/>
		  }>
		  <ThemedView style={styles.titleContainer} >
			<ThemedText  style={{ textAlign: 'center' }} type="subtitle">Battery Charge</ThemedText>
		  </ThemedView>
		<ThemedText type="title" style={{ textAlign: 'center' }}>{batteryLevel}%</ThemedText>
		  
		  <LastUpdateLabel />

	<View>
			<LineChart				
				data={{
					labels: [], //data.map((_, index) => `Point ${index + 1}`),
					datasets: [
						{
							data: signal_log
						},
					],
				}}
				width={screenWidth - 0} // Adjust width with padding
				height={200}
				chartConfig={{
					backgroundColor: '#ffffff',
					backgroundGradientFrom: '#ffffff',
					backgroundGradientTo: '#ffffff',
					decimalPlaces: 0,
					color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
					labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
					style: {
						borderRadius: 8,
					},
					propsForDots: {
						r: '0',
						strokeWidth: '0',
						stroke: '#ffa726',
					},
				}}
				style={{
					marginVertical: 0,
					borderRadius: 8,
					alignSelf: 'center',
				}}
				fromZero={true}
				yLabelsOffset={4}
			/>
		</View>

		{/* <LastUpdateLabel /> */}

		<View>			
			<Button
				title="Disconnect"
				onPress={disconnectBLE}
				color={Platform.OS === 'ios' ? '#007AFF' : '#2196F3'}
			/>
		</View>

		{/* <View>			
			<Button
				title="Query BLE Property"
				onPress={queryBLEProperty}
				color={Platform.OS === 'ios' ? '#007AFF' : '#2196F3'}
			/>
		</View> */}
	  


	</ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
	color: '#808080',
	bottom: -90,
	left: -35,
	position: 'absolute',
  },
  titleContainer: {
	flexDirection: 'row',
	gap: 8,
  },
});

