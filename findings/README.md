Hi! I've described my learnings, findings & approach to solving this challenge below. Sorry if it's a little verbose, I wanted to
document the experience properly.

Day 1:

- Before taking a look at the code, I wanted to learn more about how the money "moves" online. I started with
  researching about the transaction lifecycle, where I learnt about what happens during Authorization (legitimacy is checked,
  including customer's card/bank details & sufficiency of funds). After that, the trasaction is submitted for settlement,
  during which capturing happens. After that, settling is done which depends mostly on the processing bank. When the payment
  reaches the merchant's account, the transaction is settled.

  If transactions don't get captured in due time, their authorization expires. The time period for that depends on the payment gateways/processors.

- After the initial research, I went ahead & created the Sandbox accounts & app to check off one part from the sub-challenges.

- I forked the code & decided to dive into it to see what it was like.
  This kinda overwhelmed me, as I'd never worked with TypeScript before & the code seemed fairly challenging for me to understand,
  as I was accustomed to regular JavaScript & Front-end side in general. So I decided to come back to this later.

- I started studying Paypal API's, especially the server API calls (https://developer.paypal.com/docs/business/checkout/server-side-api-calls/#server-side-api-calls) & Order API. After pulling an all-nighter and trying out different code samples, curl commands, I went on to create a simple app on my own from scratch to get a better idea of how everything is fitting together & to understand what the actual process is, how smart buttons work, how to use the response data to make the next request & so on.

Day 2:

- I kinda had an idea now of how the PayPal APIs worked but I was still a little scared about getting into the template/framework code.

- I already sort of knew how Generics, Interfaces, etc worked in general as I've worked with Java previously but I wanted to get a better understanding
  of how they work in Typescript, so I went ahead & learnt a little more about Typescript to get comfortable enough to read/understand it without getting overwhelmed.
  The official TS docs helped.
- This is when I started working on the actual challenge itself. I started on client.js, as I have more experience on client side
  & wanted to get a head start into the challenge. I learned how to create a smart button on the client side and create an Order.
  Had some issues passing the orderID to onApprove from createOrder response but eventually figured that out by some trial & error.
- Created an order for 12.99, as I saw that currency & intent was already passed in setup.js so I didn't need to pass that in options again.
- Passed the order ID to the given function & went to the backend.
- Figured out how the orderID was being sent to the authorize method after going through server.ts
- Used the curl command to create an HTTPClient Request (after spending some time understanding how that was implemented).
  Ran into some problems with 'body' but eventually fixed that with an empty string & JSON.stringify.
- Initially hardwired the access token I got in bash through the curl command, but later realized that instead of sending
  a Bearer request with Access-Token, I could just send a Basic request with ClientID:Secret Base64 encoded.
- Spent a lot of time trying to figure out how to properly return the method, as the framework implementation of ParsedAuthorizationResponse
  was a bit complicated for me to understand.
- After a bit of studying, I figured it out.
  Realized that ParsedAuthorizationResponse isn't a class (which is why new doesn't work), it's a type. In this case, it's a bunch of different possible object shapes.
  ParsedAuthorizationResponse is just a synonym for any one of three different parametrizations of IAuthResponse.
  TransactionStatus is just a synonym for a couple of literal strings, and T & { transactionStatus: U; } is a type conjunction, meaning that the result is a type that is just like the type T, plus a field transactionStatus which is of type U (which with U extends TransactionStatus is constrained to be one or more of the strings we know as TransactionStatus).

  Finally understood that ParsedAuthorizationResponse is actually just this in a nutshell -

  type ParsedAuthorizationResponse =
  | { processorTransactionId: string; transactionStatus: 'AUTHORIZED' | 'CANCELLED' | 'SETTLING' | 'SETTLED' }
  | { declineReason: string; transactionStatus: 'DECLINED' }
  | { errorMessage: string; transactionStatus: 'FAILED' }

I was also trying to return new Promise but remembered that async functions return promise by default so I didn't specifically have to return a 'new' Promise, just ParsedAuthorizationResponse.

- Spent the next couple of hours to implement cancel order in a similar fashion. Paypal API V1 had an easy cancel request to cancel an order,
  but that wouldn't work here as there was no delete request in HTTPClient.

- Couldn't find any alternative for that in Paypal API v2 but found out that if v2 order was intent:'authorize' and you 'COMPLETED' it to get back an authorization object, you can void the authorization using the v2/payments API.
  If, however, the order was merely 'CREATED' or 'APPROVED', there is no way to cancel or void it. Simply need to have your system forget about it.

- I was earlier passing the orderID to cancel() but the void request actually took the authorization ID from the authorize response, so I had to change that part
  & pass down the authorization ID to cancel and then modify the request to use that instead.

- Understood the return type of cancel() from the framework & returned according to the status Type.

- Implemented the capture() method as well but wasn't sure how it would get called as there was no specific client side implementation for it.
  I was thinking I could maybe use setInterval to capture the payment after 10 minutes automatically, but wasn't sure where to put it & didn't spend much time on it.

- I tested the requests & responses in the network tab in developer tools during development of everything as well.
- Used bash & curl a lot to perform actions on orders first, then proceeded to implement that specific action in the file in JS.

This was quite challenging for me to be honest, as I had more experience in Frontend and no experience with Typescript. But I definitely
feel like a better developer after this challenge & really enjoyed it, despite not having slept properly the last 2 days haha.

Sending you a request with my data that includes the Findings & the Code asynchronously, will be awaiting a response.

Thank you for reading,
Rajat.
