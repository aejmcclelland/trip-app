// JavaScript code to send DELETE request using Axios
const deleteLinks = document.querySelectorAll('.delete-link');
deleteLinks.forEach((link) => {
  link.addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the default link behavior

    const attractionId = link.dataset.attractionId;
    // Send a DELETE request to the server
    axios
      .delete(`/itinerary/${attractionId}`)
      .then((response) => {
        // Handle the successful response, e.g., show a success message
        console.log('Attraction deleted successfully');
          // Redirect the user to the updated itinerary page
        window.location.href = '/itinerary';
      })
      .catch((error) => {
        // Handle errors, e.g., display an error message
        console.error('Error deleting attraction', error);
      });
  });
});
