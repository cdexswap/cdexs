export async function getUserCurrency(): Promise<string> {
  try {
    const response = await fetch('/api/location');
    const data = await response.json();
    return data.currency;
  } catch (error) {
    console.error('Error getting user location:', error);
    return ''; // Return empty string if location detection fails
  }
}
