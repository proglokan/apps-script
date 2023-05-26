function renderTemplate() {
	const template = HtmlService.createTemplateFromFile('feature-documentation-cs');
	const html = template.evaluate().setWidth(1000).setHeight(800);
	const ui = SpreadsheetApp.getUi();
	ui.showModelessDialog(html, `Feature Documentation`);
}

function createIssue(title, description) {
	const url = 'https://proglo.jetbrains.space/api/http/projects/id:4J1kZu3nIGOB/planning/issues';
	const options = {
		method: 'POST',
		headers: {
			Authorization:
				'Bearer eyJhbGciOiJSUzUxMiJ9.eyJzdWIiOiI0TlFVZ1k0TnZGQTkiLCJhdWQiOiJjaXJjbGV0LXdlYi11aSIsIm9yZ0RvbWFpbiI6InByb2dsbyIsIm5hbWUiOiJrYW53b29keSIsImlzcyI6Imh0dHBzOlwvXC9wcm9nbG8uamV0YnJhaW5zLnNwYWNlIiwicGVybV90b2tlbiI6IjJDdUdGQjBBallsSiIsInByaW5jaXBhbF90eXBlIjoiVVNFUiIsImlhdCI6MTY4NTAwNjQ1Mn0.mM8Ho_yf1WQb6tob6Hi8pYtM3b1SrUNxKILKNiBrH81YkCcfSuxDiY_X08fMpZARGwmAAVNDnY_vLCxlU2fa8jFDJKHbfs4p-yUxlRmF5PbZZWukWFL9IW8jD-PDDAVO5bnE4Q6MtAsY2ZpsmQapM-jwQS7EHNLIMPseJOMgk4A',
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			title: title,
			description: description,
			assignee: 'me',
			status: '3osHW93T6ybM',
		}),
		muteHttpExceptions: true,
	};

	const response = UrlFetchApp.fetch(url, options);
	const responseCode = response.getResponseCode();
	const responseBody = response.getContentText();

	Logger.log(`
  code: ${responseCode}
  response body: ${responseBody}
  options body: ${options.body}
  `);
}

function emailIssue(subject, body) {
	const recipient = 'kanproglo@gmail.com';
	GmailApp.sendEmail(recipient, subject, body);
}
