$(document).ready(function() {
	/* Hanlder for delete button. */
	$(".delete-button").click(function() {
		/* Confirms the user wants to delete the poll. If yes, delete request is sent. */
		if (confirm("Are you sure you want to delete the poll '" + $(this).attr("id") + "'")) {
			$.ajax({
				type: "DELETE",
				url: "/delete/" + $(this).attr("id")
			}).done(function() {
				/* When 200 status received, the page reloads. */
				location.reload();
			});
		}
	});
});