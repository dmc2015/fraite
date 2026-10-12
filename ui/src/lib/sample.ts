// Synthetic sample email used by the "Load sample" button.
// Matches api/data/sample.eml so backend parsing paths line up.

export const SAMPLE_EML = `From: dispatch@midwestexpressfreight.com
To: ops@shipperco.com
Subject: Load Confirmation - L-78213 - Chicago IL to Dallas TX - Pickup 10/14
Date: Mon, 13 Oct 2026 09:17:23 -0500
Message-ID: <load-l78213@midwestexpressfreight.com>
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

Hi team,

Confirming the following load tender:

Load ID: L-78213
Carrier: Midwest Express Freight LLC
MC Number: 823456
Equipment: 53' Dry Van

Pickup
  Location: 2300 S Western Ave, Chicago, IL 60608
  Date/Time: 10/14/2026 08:00 CT
  Contact: Jorge at (312) 555-0144

Delivery
  Location: 4500 Mockingbird Ln, Dallas, TX 75205
  Date/Time: 10/15/2026 18:00 CT
  Contact: receiving dock, no appt needed

Commodity: Automotive parts, palletized
Weight: 42,500 lbs
Rate: $2,850.00 all-in, FSC included

Special Instructions:
- Driver must have TWIC card
- Call dispatch 1 hour prior to pickup
- Lumper fee is paid by shipper, keep receipts

Please confirm acceptance by replying to this email or calling our dispatch line
at (312) 555-0100. Rate confirmation will follow once accepted.

Thanks,
Marcus Reed
Dispatcher | Midwest Express Freight LLC
dispatch@midwestexpressfreight.com | (312) 555-0100
`;
