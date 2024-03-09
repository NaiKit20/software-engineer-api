import express from "express";
import { conn } from "../database_conn";
import { UserPostRequest } from "../model/userPostRequest";
import mysql from "mysql";
import util from "util";
import path from "path";

export const router = express.Router();

router.get("/", (req, res) => {
  conn.query("SELECT User_En.id, User_En.code, User_En.fname, User_En.lname, Prefix.name as type, User_En.nickname, (YEAR(NOW()) - YEAR(birthday)) as birthday FROM User_En, Prefix where User_En.type = Prefix.id", (err, result, fields) => {
    res.json(result);
  });
});

router.get("/search/:search", (req, res) => {
  const search = `%${req.params.search}%`
  console.log(search)
  conn.query(
    "SELECT User_En.id, User_En.code, User_En.fname, User_En.lname, Prefix.name as type, User_En.nickname, (YEAR(NOW()) - YEAR(User_En.birthday)) as birthday FROM User_En JOIN Prefix ON User_En.type = Prefix.id WHERE User_En.code LIKE ? OR User_En.fname LIKE ? OR User_En.lname LIKE ? OR User_En.nickname LIKE ?",
    [search, search, search, search],
    (err, result) => {
      if(err) {
        res.json(err)
      }else {
        console.log("OK");
        res.json(result);
      }
    }
  );
});

router.get("/idx", (req, res) => {
  // conn.query("select * from Users where id = " + req.query.id, (err, result, fields)=>{
  //   res.json(result);
  // })
  if (req.query.id) {
    conn.query(
      "SELECT User_En.id, User_En.code, User_En.fname, User_En.lname, Prefix.name as type, User_En.nickname, (YEAR(NOW()) - YEAR(User_En.birthday)) as birthday FROM User_En JOIN Prefix ON User_En.type = Prefix.id WHERE User_En.id =" + req.query.id,
      (err, result, fields) => {
        res.json(result);
      }
    );
  } else {
    res.send("call get in Users with Query Param " + req.query.id);
  }
  //   res.json("this is Users page")
});


router.post("/",(req, res) => {
  let user: UserPostRequest = req.body;
  let sql =
    "INSERT INTO `User_En`(`code`, `fname`, `lname`,`type`,`nickname`,`birthday`) VALUES (?,?,?,?,?,?)";

  sql = mysql.format(sql, [
    user.code,
    user.fname,
    user.lname,
    user.type,
    user.nickname,
    user.birthday,
  ]);

  conn.query(sql, (err, result) => {
    if (err) throw err;
    res
      .status(201)
      .json({ affected_row: result.affectedRows, last_idx: result.insertId });
  });
});

router.delete("/:id", (req, res) => {
  let id = +req.params.id;
  conn.query("delete from User_En where id = ?", [id], (err, result) => {
    if (err) throw err;
    res.status(200).json({ affected_row: result.affectedRows });
  });
});

router.put("/edit/:id", async (req, res) => {
  let id = +req.params.id;
  let user: UserPostRequest = req.body;
  let userOriginal: UserPostRequest | undefined;
  const queryAsync = util.promisify(conn.query).bind(conn);

  let sql = mysql.format("select * from User_En where id = ?", [id]);

  let result = await queryAsync(sql);
  const rawData = JSON.parse(JSON.stringify(result));
  console.log(rawData);
  userOriginal = rawData[0] as UserPostRequest;
  console.log(userOriginal);

  let updateUser = { ...userOriginal, ...user };
  console.log(user);
  console.log(updateUser);

  sql =
    "update  `User_En` set `code`=?, `fname`=?, `lname`=?, `type`=?, `nickname`=? where `id`=?";
  sql = mysql.format(sql, [
    updateUser.code,
    updateUser.fname,
    updateUser.lname,
    updateUser.type,
    updateUser.nickname,
    id,
  ]);
  conn.query(sql, (err, result) => {
    if (err) throw err;
    res.status(201).json({ affected_row: result.affectedRows });
  });
});
