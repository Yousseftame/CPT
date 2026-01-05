import { setGlobalOptions } from "firebase-functions/v2";

// Set global options BEFORE importing functions
setGlobalOptions({ 
  maxInstances: 10,
  region: "us-central1"
  // ✅ CORS is set per-function, not globally
});

// Export the function
export { deleteAdminAccount } from './admin/deleteAdmin';
export { deleteCustomerAccount } from './customer/deleteCustomerAccount';
export { updateAdminStatus } from './admin/updateAdminStatus';
import { serveFile } from "./functions/serveFile";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

export { serveFile };


// If you have other functions, export them here too
// export { otherFunction } from './otherFunction';