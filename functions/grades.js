const connectDB = require("../db");
const { ObjectId } = require("mongodb");

exports.handler = async (event) => {
  const { httpMethod, path, body, queryStringParameters } = event;
  const pathParts = path.split("/").filter(Boolean);
  const id = pathParts[3] || null;

  const collection = await connectDB();

  switch (httpMethod) {
    case "GET":
      if (id) {
        try {
          const grade = await collection.findOne({ _id: new ObjectId(id) });
          if (!grade) {
            return { statusCode: 404, body: "Not found" };
          }
          return {
            statusCode: 200,
            body: JSON.stringify(grade),
          };
        } catch (e) {
          return { statusCode: 400, body: "Invalid ID format" };
        }
      } else {
        const { username } = queryStringParameters || {};
        const query = username ? { username } : {};
        const grades = await collection.find(query).toArray();
        return {
          statusCode: 200,
          body: JSON.stringify(grades),
        };
      }

    case "POST":
      try {
        const newGrade = JSON.parse(body);

        if (!newGrade.username || !newGrade.subject || typeof newGrade.grade !== "number") {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing or invalid fields" }),
          };
        }

        const result = await collection.insertOne(newGrade);
        return {
          statusCode: 201,
          body: JSON.stringify({ _id: result.insertedId, ...newGrade }),
        };
      } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
      }

    case "PUT":
      if (!id) return { statusCode: 400, body: "ID required" };
      const updatedData = JSON.parse(body);
      const updateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ modifiedCount: updateResult.modifiedCount }),
      };

    case "DELETE":
      if (!id) return { statusCode: 400, body: "ID required" };
      await collection.deleteOne({ _id: new ObjectId(id) });
      return { statusCode: 204 };

    default:
      return { statusCode: 405, body: "Method Not Allowed" };
  }
};
