$(document).ready(function() {
	/* After page is loaded, get request is sent asking fot polls data. */
	$.get("/home", function(data) {
		/* The poll-list div is emptied. */
		$(".poll-list").empty();
		/* Loop through each poll */
		for (var entry in data) {
			/* Extract each polls data and ssave in corresponding variables. */
			var poll = data[entry].name;
			var votes = data[entry].votes;
			var id = data[entry].id;
			/* Append the poll to poll-list */
			$(".poll-list").append("<li id="+poll+" class='poll-item'><a href='/polls/"+id+"'>"+poll+" <span>("+votes+" voted!)</span></a></li>");
			/* Polls given slideDown effect. */
			$(".poll-item").slideDown();
		}
	});
});