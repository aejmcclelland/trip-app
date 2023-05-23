function addToItinerary(route, attractionId, event) {
  event.preventDefault(); // Prevent the default link behavior
  // Send the POST request to the server
  axios
    .post(route, { attractionId: attractionId }) //route params get passed form EJS POST
    .then((response) => {
      // Redirect to the /itinerary page
      window.location.href = '/itinerary';
    })
    .catch((error) => {
      // Handle any errors that occur during the request
      console.error(error);
    });
}
