// Import necessary modules
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, SafeAreaView, StyleSheet, TouchableOpacity, TextInput, Alert, Picker } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Calendar from 'expo-calendar';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Function to check network connection status
const checkNetworkConnection = async () => {
  try {
    const netInfoState = await NetInfo.fetch();
    if (!netInfoState.isConnected) {
      throw new Error('No internet connection');
    }
  } catch (error) {
    throw new Error('No internet connection');
  }
};

// Call the checkNetworkConnection function
checkNetworkConnection();

// Function to play beep sound
const playSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('./assets/mixkit-classic-alarm-995.wav')
    );
    await sound.playAsync();
  } catch (error) {
    console.log('Error playing sound: ', error);
  }
};

// Create a stack navigator
const Stack = createStackNavigator();

// Home screen with buttons
function HomeScreen({ navigation }) {
  useEffect(() => {
    activateKeepAwakeAsync(); // Activate keep awake when the app mounts
  }, []);

  const [selectedCalendar, setSelectedCalendar] = useState(null);

  const handleChooseCalendar = async () => {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      setSelectedCalendar(null); // Reset selected calendar
      Alert.alert(
        'Choose Calendar',
        'Please select your default calendar:',
        calendars.map((calendar) => ({
          text: calendar.title,
          onPress: () => {
            setSelectedCalendar(calendar);
          },
        }))
      );
    } catch (error) {
      console.error('Error getting calendars:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, styles.border]}>
        <Text style={styles.headerText}>AIFit Fusion</Text>
      </View>

      {/* Workout Recommendations Button */}
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={() => navigation.navigate('WorkoutRecommendations')}
      >
        <Text style={styles.buttonText}>Workout Recommendations</Text>
      </TouchableOpacity>

      {/* Custom Workouts Button */}
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={() => navigation.navigate('CustomWorkouts')}
      >
        <Text style={styles.buttonText}>Custom Workouts</Text>
      </TouchableOpacity>

      {/* Music Playlist Button */}
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={() => navigation.navigate('MusicPlaylist')} // Navigate to 'MusicPlaylist' screen
      >
        <Text style={styles.buttonText}>Music Playlist</Text>
      </TouchableOpacity>

      {/* Nutritional Facts Button */}
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={() => navigation.navigate('NutritionalCategories')}
      >
        <Text style={styles.buttonText}>Nutritional Facts</Text>
      </TouchableOpacity>

      {/* Choose Calendar Button */}
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={handleChooseCalendar}
      >
        <Text style={styles.buttonText}>Choose Calendar</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={[styles.footer, styles.border]}>
        <Text style={styles.footerText}>© 2024 AIFit Fusion</Text>
      </View>
    </SafeAreaView>
  );
}

// Create a screen for Workout Recommendations
function WorkoutRecommendationsScreen() {
  // Define your component here
  return (
    <SafeAreaView style={styles.container}>
      <Text>Workout Recommendations</Text>
      {/* Your content for workout recommendations */}
    </SafeAreaView>
  );
}

// Create a screen for Music Playlist
function MusicPlaylistScreen({ navigation }) {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistName, setPlaylistName] = useState('');
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  const toggleSound = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (sound) {
        await sound.stopAsync();
      }
    } else {
      setIsPlaying(true);
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: selectedPlaylist },
          { shouldPlay: true }
        );
        setSound(newSound);
      } catch (error) {
        console.error('Error playing sound: ', error);
      }
    }
  };

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        const playlistURI = await AsyncStorage.getItem('playlistURI');
        if (playlistURI !== null) {
          setSelectedPlaylist(playlistURI);
        }
      } catch (error) {
        console.error('Error loading playlist from AsyncStorage:', error);
      }
    };

    loadPlaylist();
  }, []);

 const handleUploadPlaylist = async () => {
  console.log('Attempting to upload playlist...');

  // Check network connection
  try {
    const netInfoState = await NetInfo.fetch();
    if (!netInfoState.isConnected) {
      throw new Error('No internet connection');
    }
  } catch (error) {
    console.error('No internet connection:', error);
    Alert.alert('No Internet', 'Please check your internet connection and try again.');
    return;
  }

  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: false,
    });

    if (res.type === 'success' && res.uri) {
      console.log('File successfully picked:', res.uri);
      const { sound } = await Audio.Sound.createAsync({ uri: res.uri });
      console.log('Sound created successfully:', sound);
      setSound(sound);
      
      // Extracting file name from URI
      const uriParts = res.uri.split('/');
      const fileName = uriParts[uriParts.length - 1];
  
      console.log('Selected playlist:', fileName);
      setSelectedPlaylist(fileName); // Setting the playlist name here
      // Save the playlist or handle the selected file here
      await AsyncStorage.setItem('playlistURI', res.uri);
      await AsyncStorage.setItem('playlistName', fileName);
      console.log('Playlist URI and name saved to AsyncStorage');
  
      // File Format Check
      const supportedFormats = ['mp3', 'wav', 'ogg']; // Add more supported formats if needed
      const fileExtension = fileName.split('.').pop().toLowerCase();
      if (!supportedFormats.includes(fileExtension)) {
        Alert.alert('Unsupported Format', 'The selected file format is not supported.');
        return;
      }
    } else if (res.type === 'cancel') {
      console.log('Document picking cancelled');
      // Provide feedback to the user that document picking was canceled
      Alert.alert('Canceled', 'Document picking was canceled by the user.');
    } else {
      console.error('Document picking failed:', res);
      // Provide feedback to the user about the failure
      Alert.alert('Document Picking Failed', 'An error occurred while picking the document.');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    // Provide user feedback for the error
    Alert.alert('Upload Failed', 'An error occurred while uploading the file. Please try again later.');
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <Text>Create a Playlist from your Phone</Text>
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={handleUploadPlaylist}
      >
        <Text style={styles.buttonText}>Upload Playlist</Text>
      </TouchableOpacity>

      <View style={styles.playbackContainer}>
        <Text style={styles.selectedPlaylist}>{selectedPlaylist}</Text>
        <TouchableOpacity style={[styles.button, styles.border]} onPress={toggleSound}>
          <Text style={styles.buttonText}>{isPlaying ? 'Stop Music' : 'Play Music'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Create a screen to display nutritional categories
function NutritionalCategoriesScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Text style={[styles.headerText, styles.border]}>Nutritional Categories</Text>

      {/* Protein Button */}
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={() => navigation.navigate('Protein')} // Navigate to 'Protein' screen
      >
        <Text style={styles.buttonText}>Protein</Text>
      </TouchableOpacity>

      {/* Carbs Button */}
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={() => navigation.navigate('Carbs')} // Navigate to 'Carbs' screen
      >
        <Text style={styles.buttonText}>Carbs</Text>
      </TouchableOpacity>

      {/* Calories Button */}
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={() => navigation.navigate('Calories')} // Navigate to 'Calories' screen
      >
        <Text style={styles.buttonText}>Calories</Text>
      </TouchableOpacity>

      {/* Amino Acids Button */}
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={() => navigation.navigate('AminoAcids')} // Navigate to 'AminoAcids' screen
      >
        <Text style={styles.buttonText}>Amino Acids</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Create separate screens for Protein, Carbs, Calories, and Amino Acids
function ProteinScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Protein Information</Text>
    </SafeAreaView>
  );
}

function CarbsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Carbs Information</Text>
    </SafeAreaView>
  );
}

function CaloriesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Calories Information</Text>
    </SafeAreaView>
  );
}

function AminoAcidsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Amino Acids Information</Text>
    </SafeAreaView>
  );
}

// Create a screen for Custom Workouts
function CustomWorkoutsScreen({ navigation }) {
  const [workouts, setWorkouts] = useState('');

  const handleWorkoutsInput = (text) => {
    setWorkouts(text);
  };

  const handleStartWorkouts = () => {
    if (isNaN(workouts) || workouts === '') {
      Alert.alert('Invalid Input', 'Please enter a valid number of workouts.');
    } else {
      // Navigate to the screen to select workouts
      navigation.navigate('SelectWorkout', { numberOfWorkouts: parseInt(workouts) });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text>How many workouts do you want to do?</Text>
      <TextInput
        style={[styles.input, styles.border]}
        keyboardType="numeric"
        onChangeText={handleWorkoutsInput}
        value={workouts}
      />
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={handleStartWorkouts}
      >
        <Text style={styles.buttonText}>Start Workouts</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Create a screen for selecting workouts
function SelectWorkoutScreen({ route, navigation }) {
  const { numberOfWorkouts } = route.params;
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);

  const handleWorkoutSelection = (workout) => {
    if (selectedWorkouts.includes(workout)) {
      // If workout is already selected, do nothing
      return;
    }
    setSelectedWorkouts([...selectedWorkouts, workout]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text>Select {numberOfWorkouts} Workout(s)</Text>
      <View style={styles.workoutButtonsContainer}>
        {['Squat', 'Deadlift', 'Press', 'Bench'].map((workout) => (
          <TouchableOpacity
            key={workout}
            style={[
              styles.button,
              styles.border,
              selectedWorkouts.includes(workout) && styles.disabledButton,
            ]}
            onPress={() => handleWorkoutSelection(workout)}
            disabled={selectedWorkouts.length === numberOfWorkouts && !selectedWorkouts.includes(workout)}
          >
            <Text style={styles.buttonText}>{workout}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.button, styles.border]}
        onPress={() => navigation.navigate('WorkoutInput', { selectedWorkouts })}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// WorkoutInputScreen component
function WorkoutInputScreen({ route }) {
  const { selectedWorkouts } = route.params;
  const [comments, setComments] = useState('');
  const [timer, setTimer] = useState('00:00');
  const [timerInput, setTimerInput] = useState('');
  const timerRef = useRef(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null); // Define sound variable

  const handleMusicToggle = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (sound) {
        await sound.stopAsync();
      }
    } else {
      setIsPlaying(true);
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: selectedPlaylist },
          { shouldPlay: true }
        );
        setSound(newSound);
      } catch (error) {
        console.error('Error playing sound: ', error);
      }
    }
  };

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        const playlistURI = await AsyncStorage.getItem('playlistURI');
        if (playlistURI !== null) {
          setSelectedPlaylist(playlistURI);
        }
      } catch (error) {
        console.error('Error loading playlist from AsyncStorage:', error);
      }
    };

    loadPlaylist();
  }, []);

  const handleSaveToCalendar = async () => {
    try {
      const calendarPermission = await Calendar.requestCalendarPermissionsAsync();
      if (calendarPermission.status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        if (calendars.length > 0) {
          Alert.alert(
            'Choose Calendar',
            'Please select the calendar where you want to save the workout session:',
            calendars.map((calendar) => ({
              text: calendar.title,
              onPress: async () => {
                const event = {
                  title: 'Workout Session',
                  startDate: new Date(),
                  endDate: new Date(),
                  timeZone: 'local',
                  location: 'Gym',
                  notes: `Workout: ${selectedWorkouts.join(', ')}\nComments: ${comments}`,
                  calendarId: calendar.id,
                };
                const eventID = await Calendar.createEventAsync(calendar.id, event);
                Alert.alert('Success', 'Workout session saved to calendar!');
              },
            }))
          );
        } else {
          Alert.alert('No Calendars Found', 'There are no calendars available on your device.');
        }
      } else {
        Alert.alert('Permission Denied', 'Calendar permission required to save workout.');
      }
    } catch (error) {
      console.error('Error saving event to calendar:', error);
      Alert.alert('Error', 'Failed to save workout session to calendar.');
    }
  };

  const handleStartTimer = () => {
    if (!isTimerRunning) {
      const [minutes, seconds] = timer.split(':').map(parseFloat);
      const totalSeconds = (minutes * 60) + seconds;
      if (isNaN(totalSeconds) || totalSeconds <= 0) {
        Alert.alert('Invalid Input', 'Please enter a valid time.');
        return;
      }  
      let remainingSeconds = totalSeconds;

      timerRef.current = setInterval(() => {
        remainingSeconds -= 1;

        if (remainingSeconds <= 0) {
          clearInterval(timerRef.current);
          setTimer('00:00');
          playSound(); // Play beep sound when timer reaches zero
          setIsTimerRunning(false);
        } else {
          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          setTimer(`${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`);
        }
      }, 1000);

      setIsTimerRunning(true);
    }
  };

  const handleStopTimer = () => {
    clearInterval(timerRef.current);
    setTimer('00:00');
    setIsTimerRunning(false);
  };

  const handlePlaylistChange = (itemValue, itemIndex) => {
    setSelectedPlaylist(itemValue);
  };

  const handleTimerAdjust = (increment) => {
    const [minutes, seconds] = timer.split(':').map(parseFloat);
    let totalSeconds = minutes * 60 + seconds;
    if (totalSeconds + increment <= 0) {
      totalSeconds = 0;
    } else {
      totalSeconds += increment;
    }
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    setTimer(`${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`);
  };

   const handleAddMinute = () => {
    handleTimerAdjust(60);

    };

  const handleAddSecond = () => {
    handleTimerAdjust(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      {selectedWorkouts.map((workout, index) => (
        <View key={index} style={[styles.workoutInputContainer, styles.border]}>
          <Text>{workout}</Text>
          <TextInput
            style={[styles.input, styles.border]}
            placeholder="Enter details"
            onChangeText={(text) => {}}
          />
        </View>
      ))}
      <View style={[styles.commentsContainer, styles.border]}>
        <Text>Comments:</Text>
        <TextInput
          style={[styles.input, styles.commentsInput, styles.border]}
          multiline
          numberOfLines={4}
          value={comments}
          onChangeText={setComments}
          placeholder="Add your comments here"
        />
      </View>
      <View style={[styles.timerContainer, styles.border]}>
        <TouchableOpacity style={styles.timerButton} onPress={handleMusicToggle}>
          <Text style={styles.buttonText}>{isPlaying ? 'Stop Music' : 'Play Music'}</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.timerContainer, styles.border]}>
        <TouchableOpacity style={styles.timerButton} onPress={handleAddMinute}>
          <Text style={styles.buttonText}>Min</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.timerButton} onPress={handleAddSecond}>
          <Text style={styles.buttonText}>Sec</Text>
        </TouchableOpacity>
        <Text style={styles.timerText}>{timer}</Text>
        <TouchableOpacity
          style={[styles.button, styles.timerButton]}
          onPress={handleStartTimer}
        >
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.timerButton]}
          onPress={handleStopTimer}
        >
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.timerContainer, styles.border]}>
        <Text>Music Playlist:</Text>
      </View>
      <TouchableOpacity
        style={[styles.button, styles.timerButton, { backgroundColor: '#2ecc71' }]}
        onPress={handleSaveToCalendar}
      >
        <Text style={styles.buttonText}>Save to Calendar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Create separate screens for Squat, Deadlift, Press, and Bench workouts
function SquatScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Squat Information</Text>
    </SafeAreaView>
  );
}

function DeadliftScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Deadlift Information</Text>
    </SafeAreaView>
  );
}

function PressScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Press Information</Text>
    </SafeAreaView>
  );
}

function BenchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Bench Information</Text>
    </SafeAreaView>
  );
}

// Export App function as default
export default function App() {

  useEffect(() => {
    requestStoragePermission(); // Request storage permission when component mounts
  }, []);

  const requestStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Permission Required',
          message: 'This app needs access to your storage to upload music files.',
          buttonPositive: 'OK',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Storage permission denied');
        // Handle denied permission (show an alert)
        Alert.alert(
          'Permission Denied',
          'This app needs access to your storage to function properly. Please grant the permission in settings.',
          [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
        );
      }
    } catch (error) {
      console.error('Error requesting storage permission:', error);
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        {/* Home Screen */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        {/* Nutritional Categories Screen */}
        <Stack.Screen
          name="NutritionalCategories"
          component={NutritionalCategoriesScreen}
          options={{ title: 'Nutritional Categories' }}
        />
        {/* Screens for Protein, Carbs, Calories, and Amino Acids */}
        <Stack.Screen name="Protein" component={ProteinScreen} />
        <Stack.Screen name="Carbs" component={CarbsScreen} />
        <Stack.Screen name="Calories" component={CaloriesScreen} />
        <Stack.Screen name="AminoAcids" component={AminoAcidsScreen} />
        {/* Screen for Music Playlist */}
        <Stack.Screen name="MusicPlaylist" component={MusicPlaylistScreen} />
        {/* Screen for Custom Workouts */}
        <Stack.Screen name="CustomWorkouts" component={CustomWorkoutsScreen} />
        {/* Screen for Workout Recommendations */}
        <Stack.Screen name="WorkoutRecommendations" component={WorkoutRecommendationsScreen} />
        {/* Screen for selecting workouts */}
        <Stack.Screen name="SelectWorkout" component={SelectWorkoutScreen} />
        {/* Screen for inputting workout details */}
        <Stack.Screen name="WorkoutInput" component={WorkoutInputScreen} />
        {/* Screens for Squat, Deadlift, Press, and Bench workouts */}
        <Stack.Screen name="Squat" component={SquatScreen} />
        <Stack.Screen name="Deadlift" component={DeadliftScreen} />
        <Stack.Screen name="Press" component={PressScreen} />
        <Stack.Screen name="Bench" component={BenchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2ecc71',
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#34495e',
    padding: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerText: {
    fontSize: 12,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    width: 200,
    textAlign: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#95a5a6', // Change to a darker color to indicate it's disabled
  },
  workoutButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  workoutInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  commentsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  commentsInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 20,
  },
  timerButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  selectedPlaylist: {
    fontSize: 16,
    marginBottom: 10,
  },
  playbackContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
});
