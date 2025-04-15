
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



export default function TabTwoScreen() {

	const [dynamicData, setDynamicData] = useState(signal_log);

	useEffect(() => {
		const interval = setInterval(() => {
			setDynamicData([...signal_log]); // Update state with the latest signal_log
		}, 1000); // Adjust the interval as needed

		return () => clearInterval(interval); // Cleanup on unmount
	}, []);


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
		  <ThemedView style={styles.titleContainer}>
			<ThemedText type="title">Details Page</ThemedText>
		  </ThemedView>
		  <ThemedText>HRM Graph</ThemedText>
		  <LastUpdateLabel />
	  
	<View>
			<LineChart				
				data={{
					labels: [], //data.map((_, index) => `Point ${index + 1}`),
					datasets: [
						{
							data: [-30, ...data, -95]
						},
					],
				}}
				width={screenWidth - 40} // Adjust width with padding
				height={220}
				chartConfig={{
					backgroundColor: '#ffffff',
					backgroundGradientFrom: '#ffffff',
					backgroundGradientTo: '#ffffff',
					decimalPlaces: 0,
					color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
					labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
					style: {
						borderRadius: 16,
					},
					propsForDots: {
						r: '0',
						strokeWidth: '0',
						stroke: '#ffa726',
					},
				}}
				style={{
					marginVertical: 8,
					borderRadius: 16,
					alignSelf: 'center',
				}}
				fromZero={false}
				yLabelsOffset={10}
			/>
		</View>

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

