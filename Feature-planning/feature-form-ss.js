function createIssue() {
	window.fetch(
		'https://proglo.jetbrains.space/api/http/projects/id:4J1kZu3nIGOB/planning/issues',
		{
			method: 'POST',
			headers: {
				Authorization:
					'Bearer eyJhbGciOiJSUzUxMiJ9.eyJzdWIiOiI0TlFVZ1k0TnZGQTkiLCJhdWQiOiJjaXJjbGV0LXdlYi11aSIsIm9yZ0RvbWFpbiI6InByb2dsbyIsInNjb3BlIjoiKioiLCJuYW1lIjoia2Fud29vZHkiLCJpc3MiOiJodHRwczpcL1wvcHJvZ2xvLmpldGJyYWlucy5zcGFjZSIsInByaW5jaXBhbF90eXBlIjoiVVNFUiIsImV4cCI6MTY4MzMyMzQ3MywiaWF0IjoxNjgzMzIyODczLCJzaWQiOiIzNmRXRHUyWWZoak8ifQ.TklHImXWQlV7JUYUuQK2dCnzrwasS55geTW7DllGhc8bJ-M033800nz5JsNeu7aKZo_gBzw6TwAx2NgmdUx3syDjdbCE0Tx9LlTxf7p2KWXRMjdYgTegNZemanfsZIqJB6_7Iqk19F4hY-gtng56-TSFWzjqllWrQTvjlf4nZqE',
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				title: 'TITLE',
				description: 'DESCRIPTION',
				assignee: 'me',
				status: 'Open',
				attachments: [],
				customFields: [
					{
						fieldId: '1',
						value: {
							className: 'AutonumberCFValue',
						},
					},
				],
			}),
		}
	);
}
