use actix_identity::Identity;
use actix_web::{get, post, web, HttpRequest, HttpResponse, Responder};
use serde_json::json;

use crate::{db::MainDbPooledConnection, error::AppResult};

#[derive(sqlx::FromRow)]
struct User {
    email: String,
    password_hash: String,
}

#[post("/login")]
pub async fn login(
    request: HttpRequest,
    db: web::Data<MainDbPooledConnection>,
) -> AppResult<impl Responder> {
    let hash = sqlx::query_scalar("SELECT password_hash FROM users WHERE id = $1;")
        .bind("TODO")
        .fetch_one(db.get_ref())
        .await?;

    

    Ok(HttpResponse::Ok().body("Hello world!"))
}

#[get("/logout")]
pub async fn logout(user: Identity) -> impl Responder {
    user.logout();
    HttpResponse::Ok().json(json! {
        {
            "message": "successfully logged out"
        }
    })
}

#[post("/signup")]
pub async fn signup() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}
