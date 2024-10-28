use std::io::Read;

use actix_identity::Identity;
use actix_multipart::form::{tempfile::TempFile, MultipartForm};
use actix_web::{delete, get, patch, post, web, HttpResponse, Responder};
use serde_json::json;
use uuid::Uuid;

use crate::{
    db::MainDbPooledConnection,
    error::{AppError, AppResult},
};

#[derive(Debug, MultipartForm)]
struct UploadForm {
    file: TempFile,
}

#[post("/works")]
pub async fn create_work(
    MultipartForm(mut form): MultipartForm<UploadForm>,
    db: web::Data<MainDbPooledConnection>,
    identity: Option<Identity>,
) -> AppResult<impl Responder> {
    let Some(identity) = identity else {
        return Err(AppError::AuthErr("not logined".to_string()));
    };

    let mut buf: Vec<u8> = vec![];
    form.file.file.read_to_end(&mut buf)?;

    let uuid = Uuid::new_v4();

    let owner_id: i32 = sqlx::query_scalar("SELECT id FROM users WHERE email = $1;")
        .bind(identity.id()?)
        .fetch_one(db.as_ref())
        .await?;

    sqlx::query("INSERT INTO works (id, owner_id, comic_data) VALUES ($1, $2, $3);")
        .bind(uuid)
        .bind(owner_id)
        .bind(buf)
        .execute(db.as_ref())
        .await?;

    Ok(HttpResponse::Ok().json(json! {
        {
            "id": uuid.to_string()
        }
    }))
}

#[get("/works/{id}")]
pub async fn get_work(
    db: web::Data<MainDbPooledConnection>,
    identity: Option<Identity>,
    path: web::Path<String>,
) -> impl Responder {
    let Some(identity) = identity else {
        return Err(AppError::AuthErr("not logined".to_string()));
    };

    let owner_id: i32 = sqlx::query_scalar("SELECT id FROM users WHERE email = $1;")
        .bind(identity.id()?)
        .fetch_one(db.as_ref())
        .await?;

    let data: Result<Vec<u8>, sqlx::Error> =
        sqlx::query_scalar("SELECT comic_data from works WHERE id = $1 AND owner_id = $2")
            .bind(Uuid::parse_str(path.as_str())?)
            .bind(owner_id)
            .fetch_one(db.as_ref())
            .await;

    let Ok(data) = data else {
        return Ok(HttpResponse::NotFound().json(json! {
            {
                "message": "not found"
            }
        }));
    };

    Ok(HttpResponse::Ok().body(data))
}

#[patch("/works/{id}")]
pub async fn update_work(
    MultipartForm(mut form): MultipartForm<UploadForm>,
    db: web::Data<MainDbPooledConnection>,
    identity: Option<Identity>,
    path: web::Path<String>,
) -> AppResult<impl Responder> {
    let Some(identity) = identity else {
        return Err(AppError::AuthErr("not logined".to_string()));
    };

    let mut buf: Vec<u8> = vec![];
    form.file.file.read_to_end(&mut buf)?;

    let owner_id: i32 = sqlx::query_scalar("SELECT id FROM users WHERE email = $1;")
        .bind(identity.id()?)
        .fetch_one(db.as_ref())
        .await?;

    sqlx::query("UPDATE works SET comic_data = $1 WHERE id = $2 AND owner_id = $3")
        .bind(buf)
        .bind(Uuid::parse_str(path.as_str())?)
        .bind(owner_id)
        .execute(db.as_ref())
        .await?;

    Ok(HttpResponse::Ok().json(json! {
        {
            "message": "successfully updated"
        }
    }))
}

#[delete("/works/{id}")]
pub async fn delete_work() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}
