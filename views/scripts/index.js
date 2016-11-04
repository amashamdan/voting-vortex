$(document).ready(function() {
	$.get("/home", function(data) {
		$(".poll-list").empty();
		for (var entry in data) {
			var poll = data[entry].name;
			var votes = data[entry].votes;
			var id = data[entry].id;
			$(".poll-list").append("<li id="+poll+" class='poll-item'><a href='/polls/"+id+"'>"+poll+" <span>("+votes+" voted!)</span></a></li>");
			$(".poll-item").slideDown();
		}
	});
});