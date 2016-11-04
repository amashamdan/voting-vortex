/* ALL CODE HERE IS RELATED TO ADD POLL FORM, it's used by all ejs files. */
$(document).ready(function() {
	/* "Add poll" button handler */
	$("#new-poll-button").click(function() {
		/* It fades in the new poll form. */
		$(".layer, .new-poll").fadeToggle();
	})
	/* Handler for clicking the "Add option" button in the poll form. */
	$("#add-option").click(function(e) {
		e.preventDefault();
		/* A new input field is appended. */
		$(".new-poll-options").append('<input class="input-field" placeholder="Option" type="text" name="option">');
	});
	/* "Cancel" button handler. The form fades out. */
	$("#new-form-cancel").click(function(e) {
		e.preventDefault();
		/* The form is reset and all entered data are deleted. */
		document.getElementById("new-poll-form").reset();
		$(".layer, .new-poll").fadeToggle();
	});
	/* Handler for clicking "Remove option." */
	$("#remove-option").click(function(e) {
		e.preventDefault();
		/* It removes the last input field. */
		$(".new-poll-options").children().last().remove();
	});
	/* Handler for the form submission. */
	$("#new-poll-form").on("submit", function(e) {
		/* Submission is paused. */
		e.preventDefault();
		/* Boolean to indicate if all fields are filled or not, true means all are filled. */
		var allFilled = true;
		/* A variable to store the number of input fields including the poll's name. */
		var numberOfOptions = 0;
		/* Checks every input field present. */
		$(".input-field").each(function(i) {
			/* numberOfOptions is incremenred. */
			numberOfOptions++;
			/* Checks that the current input field is filled. If not, allFilled variable is set to false. */
			if ($(this).val() == "" || $(this).val() == " ") {
				allFilled = false;
			}
		});
		/* If not all fields are filled, a message is alerted. */
		if (!allFilled) {
			alert("Please make sure all field are filled.");
		} else if (numberOfOptions < 3) {
			/* The number of fields should be at least 3 (the poll's name and 2 options), if less than that a message is alerted. */
			alert("Please enter two options at least... It's not a poll with less than two options :)");
		} else {
			/* If form is filled correctly and has at least two option, submission resumes. */
			e.target.submit();
		}
	});
});	