/**
 * Simple middleware to get userId from request
 * Checks for userId in request body, query params, or headers
 */
// exports.getUserFromRequest = (req, res, next) => {
//   // const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
//   const userId = req.headers;
  
//   if (!userId) {
//     return res.status(401).json({ 
//       success: false, 
//       message: 'User ID is required' 
//     });
//   }

//   req.userId = userId;
//   next();
// };
