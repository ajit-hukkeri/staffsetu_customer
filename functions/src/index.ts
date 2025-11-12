// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";

// --- NEW v2 IMPORT ---
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore(); // <-- Initialize Firestore Admin

// --- v1 Function (This is correct) ---
export const authenticateUser = functions.https.onCall(async (data, context) => {
  const phoneEmailToken = (data as any).data.phoneEmailToken;

  if (typeof phoneEmailToken !== "string" || !phoneEmailToken) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Request must include a 'phoneEmailToken' string."
    );
  }

  try {
    const apiKey = process.env.PHONE_EMAIL_API_KEY;
    if (!apiKey) {
      throw new functions.https.HttpsError(
        "internal",
        "API key for phone.email is not configured."
      );
    }

    const decodedToken: any = jwt.verify(phoneEmailToken, apiKey);

    if (!decodedToken.country_code || !decodedToken.phone_no) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Token did not contain a valid phone number."
      );
    }
    const phoneNumber = decodedToken.country_code + decodedToken.phone_no;

    let userRecord;
    try {
      // This part handles returning users
      userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
    } catch (error: any) {
      // This part handles NEW users
      if (error.code === "auth/user-not-found") {
        // Step 1: Create the user in Firebase Authentication
        userRecord = await admin.auth().createUser({ phoneNumber });

        // Step 2 (NEW): Create a corresponding user profile in Firestore
        await db.collection("users").doc(userRecord.uid).set({
          uid: userRecord.uid,
          phoneNumber: userRecord.phoneNumber,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          onboardingComplete: false, // <-- This is the crucial flag!
        });
      } else {
        throw error;
      }
    }

    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    return { token: customToken };
  } catch (error: any) {
    console.error("Authentication failed with a detailed error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The provided token was invalid or expired."
      );
    }
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred. Check the function logs for details."
    );
  }
});

// --- v2 Function (This is now correct) ---
export const onServiceRequestCreated = onDocumentCreated("serviceRequests/{requestId}", async (event) => {
    
    const snapshot = event.data; // Get the data from the event
    if (!snapshot) {
      console.log("No data for service request event.");
      return;
    }

    const request = snapshot.data();
    if (!request) {
      console.log("No data in snapshot.");
      return;
    }
    
    // 1. Get the organization's name for a nice log message
    let orgName = "Unknown Organization";
    try {
      if (request.orgId) {
        const orgDoc = await admin
          .firestore()
          .collection("organizations")
          .doc(request.orgId)
          .get();
        if (orgDoc.exists) {
          orgName = orgDoc.data()?.orgName;
        }
      }
    } catch (error) {
      console.error("Could not fetch organization name:", error);
    }
    
    // 2. Log the event (This shows up in your Firebase Functions logs)
    console.log(`
      ****************************************
      * NEW QUOTE REQUEST
      * From: ${orgName} (OrgID: ${request.orgId})
      * Service: ${request.serviceName}
      * Details: ${request.details}
      *
      * Please log in to the admin panel to respond.
      ****************************************
    `);
    
    // 3. (Future Step) Send a real notification
    // This is where you would add code to send an email (using SendGrid)
    // or a Slack message to your ops team.
    
    return;
  });

export const addAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the user calling this function is an admin
  // IMPORTANT: For the *first time*, comment out this check,
  // run the function, then uncomment it for future security.
  // if (context.auth?.token.admin !== true) {
  //   return { error: "Only admins can add other admins." };
  // }

  const userEmail = data.data.email;
  try {
    const user = await admin.auth().getUserByEmail(userEmail);
    // Set the custom claim { admin: true }
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    return { message: `Success! ${userEmail} has been made an admin.` };
  } catch (error) {
    console.error(error);
    return { error: "Failed to add admin role." };
  }
});

export const rejectPartnerApplication = onCall(async (request) => {
  // if (request.auth?.token.admin !== true) {
  //   throw new HttpsError("permission-denied", "Only admins can perform this action.");
  // }
  
  // Your admin panel sends { partnerUid: "..." }
  const partnerUid = request.data.partnerUid;
  
  if (!partnerUid) {
     throw new HttpsError("invalid-argument", "partnerUid is required.");
  }

  try {
    const bucket = admin.storage().bucket();

    // 1. Delete Aadhaar Photo
    const aadhaarPath = `partners/${partnerUid}/aadhaar.jpg`;
    await bucket.file(aadhaarPath).delete().catch(e => console.error(`Aadhaar delete failed: ${e.message}`));
    
    // 2. Delete Selfie Photo
    const selfiePath = `partners/${partnerUid}/selfie.jpg`;
    await bucket.file(selfiePath).delete().catch(e => console.error(`Selfie delete failed: ${e.message}`));
    
    // 3. Delete Firestore Document
    await db.collection('partners').doc(partnerUid).delete();

    // 4. Delete the Firebase Auth User
    await admin.auth().deleteUser(partnerUid);

    return { message: `Successfully deleted all data for partner ${partnerUid}` };
  } catch (error) {
    console.error("Error rejecting partner:", error);
    throw new HttpsError("internal", "Failed to delete partner data.");
  }
});