$(document).ready(function() {
	$(".delete-button").click(function() {
		if (confirm("Are you sure you want to delete the poll '" + $(this).attr("id") + "'")) {
			$.ajax({
				type: "DELETE",
				url: "/delete/" + $(this).attr("id")
			}).done(function() {
				location.reload();
			});
		}
	});
});