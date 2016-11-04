$(document).ready(function() {	
	$("#new-poll-button").click(function() {
		$(".layer, .new-poll").fadeToggle();
	})

	$("#add-option").click(function(e) {
		e.preventDefault();
		$(".new-poll-options").append('<input class="input-field" placeholder="Option" type="text" name="option">');
	});

	$("#new-form-cancel").click(function(e) {
		e.preventDefault();
		document.getElementById("new-poll-form").reset();
		$(".layer, .new-poll").fadeToggle();
	});

	$("#remove-option").click(function(e) {
		e.preventDefault();
		$(".new-poll-options").children().last().remove();
	});


	$("#new-poll-form").on("submit", function(e) {
		e.preventDefault();
		var allFilled = true;
		var numberOfOptions = 0;
		$(".input-field").each(function(i) {
			numberOfOptions++;
			if ($(this).val() == "" || $(this).val() == " ") {
				allFilled = false;
			}
		});

		if (!allFilled) {
			alert("Please make sure all field are filled.");
		} else if (numberOfOptions < 3) {
			alert("Please enter two options at least... It's not a poll with less than two options :)");
		} else {
			e.target.submit();
		}
	});
});	